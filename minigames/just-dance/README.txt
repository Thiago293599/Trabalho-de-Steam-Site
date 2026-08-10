JUST DANCE - SENSOR LAB / PRIMEIRA MÚSICA

Nesta versão:
- Rain Over Me foi adicionada como primeira música de teste.
- O player DEV usa o vídeo Low para manter o pacote menor.
- A timeline RainOverMe_moves0.json já é lida e o movimento atual aparece durante o vídeo.
- Os classificadores Wii U (.msm) foram preservados para a etapa de pontuação real.

Sensores:
- DeviceMotion e DeviceOrientation continuam suportados.
- Se rotationRate não chegar, a rotação é estimada pelas mudanças de orientação.
- Chrome/Android também tenta Gyroscope/Accelerometer da Generic Sensor API.
- O site envia telemetria em ~20 Hz.
- HTTPS é obrigatório para os sensores em navegadores modernos.

A pontuação atual ainda é diagnóstico de movimento. A próxima etapa é interpretar/calibrar os .msm e sincronizar julgamento com a timeline da música.
