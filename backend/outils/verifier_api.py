# -*- coding: utf-8 -*-
"""Interroge l'API de bout en bout et verifie les regles du cahier des charges.

Lance le serveur lui-meme sur un port libre, pour ne pas interroger par
megarde un serveur reste en route sur une autre base — ce qui est exactement
l'erreur qui vient de se produire.
"""

from __future__ import annotations

import json
import os
import socket
import subprocess
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

RACINE = Path(r"C:\ALLPROJECT\Professionnel\GroupAchat\backend")
PYTHON = RACINE / ".venv" / "Scripts" / "python.exe"


def port_libre() -> int:
    with socket.socket() as s:
        s.bind(("127.0.0.1", 0))
        return s.getsockname()[1]


def appeler(url: str, corps: dict | None = None) -> tuple[int, dict | list]:
    donnees = json.dumps(corps).encode() if corps is not None else None
    requete = urllib.request.Request(
        url,
        data=donnees,
        headers={"Content-Type": "application/json"},
        method="POST" if corps is not None else "GET",
    )
    try:
        with urllib.request.urlopen(requete, timeout=20) as reponse:
            return reponse.status, json.loads(reponse.read().decode())
    except urllib.error.HTTPError as erreur:
        return erreur.code, json.loads(erreur.read().decode())


def main() -> int:
    # On repart d'une base propre : une verification qui depend de ce qu'une
    # execution precedente a laisse derriere elle ne verifie rien.
    for commande in (["flush", "--noinput"], ["charger_demo"]):
        resultat = subprocess.run(
            [str(PYTHON), "manage.py", *commande],
            cwd=RACINE,
            capture_output=True,
            text=True,
        )
        if resultat.returncode != 0:
            print(resultat.stderr, file=sys.stderr)
            return 1
    print("Base remise a neuf, jeu de demonstration recharge.")
    print()

    port = port_libre()
    base = f"http://127.0.0.1:{port}/api"

    serveur = subprocess.Popen(
        [str(PYTHON), "manage.py", "runserver", str(port), "--noreload"],
        cwd=RACINE,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
        env={**os.environ, "PYTHONUNBUFFERED": "1"},
    )

    try:
        for _ in range(40):
            time.sleep(0.5)
            try:
                appeler(f"{base}/campagnes/")
                break
            except Exception:
                continue
        else:
            print("Le serveur n'a pas demarre.", file=sys.stderr)
            return 1

        resultats: list[tuple[str, bool, str]] = []

        def verifier(libelle: str, condition: bool, detail: str) -> None:
            resultats.append((libelle, condition, detail))

        # ── Le catalogue est public (§1.5) ──────────────────────────────────
        code, catalogue = appeler(f"{base}/campagnes/")
        fil_rouge = next(
            c for c in catalogue["results"] if "couteurs" in c["titre"]
        )
        verifier(
            "catalogue lisible sans compte",
            code == 200,
            f"HTTP {code}, {catalogue['count']} campagnes",
        )
        verifier(
            "fil rouge : 4 000 F, 32 acheteurs confirmes",
            fil_rouge["prix_part"] == "4000"
            and fil_rouge["acheteurs_confirmes"] == 32,
            f"{fil_rouge['prix_part']} F, {fil_rouge['acheteurs_confirmes']} acheteurs",
        )
        verifier(
            "le nom reel du groupeur ne sort pas",
            "Mensah" not in json.dumps(catalogue, ensure_ascii=False),
            f"groupeur affiche : {fil_rouge['groupeur']}",
        )

        # ── Ce que le groupeur voit (§1.7) ──────────────────────────────────
        identifiant = fil_rouge["id"]
        _, lignes = appeler(f"{base}/campagnes/{identifiant}/commandes/")
        brut = json.dumps(lignes, ensure_ascii=False)
        fuites = [
            mot
            for mot in ("repere", "telephone", "acheteur", "+228", "Acheteur")
            if mot in brut
        ]
        verifier(
            "vue groupeur : aucune identite",
            not fuites,
            f"{len(lignes)} lignes, champs = {sorted(lignes[0])}",
        )

        # ── Le paiement et l'idempotence ────────────────────────────────────
        commande = {
            "campagne": identifiant,
            "telephone": "+22890123456",
            "nom": "Akosua Doe",
            "quantite": 1,
            "quartier": "Tokoin",
            "repere": "rue des Cocotiers, pres de la pharmacie Sodji",
            "cle_idempotence": f"verif-{int(time.time())}",
        }
        code1, premiere = appeler(f"{base}/commandes/payer/", commande)
        code2, seconde = appeler(f"{base}/commandes/payer/", commande)

        verifier(
            "paiement : 4 000 + 1 000 = 5 000 F",
            premiere["montant_parts"] == "4000"
            and premiere["frais_livraison"] == "1000"
            and premiere["total"] == "5000",
            f"parts={premiere['montant_parts']} frais={premiere['frais_livraison']} total={premiere['total']}",
        )
        verifier(
            "idempotence : 201 puis 200, meme code",
            code1 == 201
            and code2 == 200
            and premiere["code_livraison"] == seconde["code_livraison"],
            f"HTTP {code1} puis {code2}, code {premiere['code_livraison']}",
        )

        _, mes_commandes = appeler(
            f"{base}/commandes/?telephone=%2B22890123456"
        )
        verifier(
            "une seule commande creee",
            len(mes_commandes) == 1,
            f"{len(mes_commandes)} commande(s)",
        )

        # ── Zone non desservie ──────────────────────────────────────────────
        code, erreur = appeler(
            f"{base}/commandes/payer/",
            {**commande, "quartier": "Kpalime", "cle_idempotence": "verif-kpalime"},
        )
        verifier(
            "zone non desservie refusee",
            code == 400 and "quartier" in erreur,
            f"HTTP {code}",
        )

        # ── La moderation (§14.2) ───────────────────────────────────────────
        code, refus = appeler(
            f"{base}/questions/",
            {
                "campagne": identifiant,
                "telephone": "+22890123456",
                "texte": "Appelez-moi au 90 12 34 56",
            },
        )
        texte_refus = json.dumps(refus, ensure_ascii=False).lower()
        verifier(
            "question avec un numero : refusee",
            code == 400,
            f"HTTP {code}",
        )
        verifier(
            "le refus n'accuse pas l'acheteur",
            not any(
                mot in texte_refus
                for mot in ("interdit", "violation", "contournement")
            ),
            "aucun mot accusateur",
        )

        code, question = appeler(
            f"{base}/questions/",
            {
                "campagne": identifiant,
                "telephone": "+22890123456",
                # Pas d'horodatage numerique ici : dix chiffres d'affilee
                # declenchent le filtre, ce qui est voulu.
                "texte": "Quelle longueur de cable ? "
                + "".join(chr(97 + (int(time.time()) >> (i * 4)) % 26) for i in range(6)),
            },
        )
        verifier(
            "vraie question : publiee",
            code == 201,
            f"HTTP {code}, auteur affiche « {question.get('auteur')} »",
        )

        code, sans_compte = appeler(
            f"{base}/questions/",
            {"campagne": identifiant, "texte": "Une question sans compte ?"},
        )
        verifier(
            "poser une question sans compte : refuse",
            code == 400 and "telephone" in sans_compte,
            f"HTTP {code}",
        )

        # ── Rapport ─────────────────────────────────────────────────────────
        largeur = max(len(libelle) for libelle, _, _ in resultats)
        echecs = 0
        for libelle, ok, detail in resultats:
            marque = "OK  " if ok else "ECHEC"
            if not ok:
                echecs += 1
            print(f"{marque}  {libelle.ljust(largeur)}  {detail}")

        print()
        print(f"{len(resultats) - echecs}/{len(resultats)} verifications passees.")
        return 1 if echecs else 0

    finally:
        serveur.terminate()
        serveur.wait(timeout=10)


if __name__ == "__main__":
    raise SystemExit(main())
