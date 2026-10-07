# Jogo da Memória

Jogo da memória com cartas de baralho, feito com HTML, CSS e JavaScript puros, sem bibliotecas. Design minimalista, de traço simples, com tema claro e escuro automático.

## Como jogar

1. Escolha o nível de dificuldade.
2. Clique em **Iniciar** (o cronômetro começa).
3. Vire duas cartas por vez e encontre todos os pares antes do tempo acabar.

## Funcionalidades

- Grade de cartas viradas para baixo, que se revelam ao clique
- Pares encontrados ficam visíveis; erros voltam a ficar ocultos
- Cronômetro com limite de tempo por nível
- Diálogo de parabéns com o tempo final (ou aviso de tempo esgotado)
- Estatísticas por nível: vitórias, derrotas e melhor tempo, salvas no navegador (`localStorage`)

## Níveis

| Nível   | Cartas | Tempo  |
|---------|--------|--------|
| Fácil   | 6      | 60 s   |
| Médio   | 12     | 90 s   |
| Difícil | 16     | 100 s  |

## Estrutura

```
index.html   # estrutura da página
style.css    # visual e animação de virar carta
script.js    # lógica do jogo, cronômetro e estatísticas
```

## Como rodar

Baixe os arquivos e abra o `index.html` no navegador. Não precisa instalar nada.
