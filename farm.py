import subprocess
import time
import sys
import random

DIRECOES = ['Up', 'Down', 'Left', 'Right']
ESPADA = 's'

def get_window_id():
    try:
        output = subprocess.check_output(['xdotool', 'search', '--name', 'GraalOnline']).decode('utf-8')
        ids = output.strip().split('\n')
        return ids[-1] if ids else None
    except:
        return None

def soltar_tudo(window_id):
    """Emergência para soltar as teclas no sistema."""
    for tecla in DIRECOES:
        subprocess.run(['xdotool', 'keyup', '--window', window_id, tecla], stderr=subprocess.DEVNULL)

def main():
    window_id = get_window_id()
    if not window_id:
        print("[ERRO] Abre o Graal primeiro!")
        sys.exit(1)

    print("==================================================")
    print(" 🪚 MODO SERRA ELÉTRICA (MÁXIMO DE HITS) 🪚 ")
    print("==================================================")
    print("Clica na janela do jogo! O caos começa em 3 segundos...")
    time.sleep(3)

    try:
        direcao_anterior = None
        while True:
            direcao = random.choice([d for d in DIRECOES if d != direcao_anterior])
            direcao_anterior = direcao
            
            # Vamos forçar 25 espadadas por movimento
            # Como o delay é de 40ms, isso dá 1 segundo de puro ataque ininterrupto
            qtd_espadadas = 25
            
            # Cria uma string com o 's ' repetido 25 vezes (ex: 's s s s s ...')
            sequencia_hits = f"{ESPADA} " * qtd_espadadas
            
            print(f" -> Segurando {direcao.upper()} e macetando a espada {qtd_espadadas} vezes seguidas!")
            
            # O Xdotool tem um delay nativo entre teclas. 
            # '--delay 40' significa que ele vai apertar a espada a cada 40 milissegundos
            comando_xdotool = (
                f"xdotool keydown --window {window_id} {direcao} "
                f"key --window {window_id} --delay 40 {sequencia_hits} "
                f"keyup --window {window_id} {direcao}"
            )
            
            subprocess.run(comando_xdotool, shell=True)

    except KeyboardInterrupt:
        print("\n\n[!] Parando a serra...")
        soltar_tudo(window_id)

if __name__ == "__main__":
    main()