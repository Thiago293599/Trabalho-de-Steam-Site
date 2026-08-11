JUST DANCE - SENSOR LAB / MÚSICAS DE TESTE

Nesta versão:
- Rain Over Me continua disponível como música de teste.
- Earth Song (Michael Jackson: The Experience) foi adicionada como música BETA.
- O player permite trocar de música sem sair do Sensor Lab.
- As duas músicas têm vídeo Low / Medium / High e áudio separado para sincronismo.
- Timeline, letras, pictogramas e Gold Moves são lidos a partir dos arquivos de cada música.
- A sincronia manual é salva separadamente para cada música.

Earth Song (BETA):
- 122 movimentos.
- 94 pictogramas.
- 61 linhas/segmentos de letra convertidos para o player.
- 3 Gold Moves marcados na timeline.
- Classificadores LiveMove da fonte Wii foram preservados no pacote da música.
- A calibração fina de pontuação/classificadores ainda é experimental.

Sensores:
- DeviceMotion e DeviceOrientation continuam suportados.
- Se rotationRate não chegar, a rotação é estimada pelas mudanças de orientação.
- Chrome/Android também tenta Gyroscope/Accelerometer da Generic Sensor API.
- O site envia telemetria em ~20 Hz.
- HTTPS é obrigatório para os sensores em navegadores modernos.

Servidor:
- O site usa o servidor online configurado em config.js.
- A tela inicial e a página de controle aguardam /api/status responder antes de liberar a interface.
