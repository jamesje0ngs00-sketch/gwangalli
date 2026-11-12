# 광안리 선화

광안대교가 보이는 광안리 해변을 펜 선으로 그린 움직이는 그림입니다. 낮에서 밤으로 시간이 흐르고, 누르는 것마다 반응합니다.

**보기:** https://jamesje0ngs00-sketch.github.io/gwangalli/

- 해나 달을 끌면 시간이 바뀝니다.
- 다리를 누르면 조명이 바뀌고, 바다를 누르면 큰 파도가 옵니다.
- 사람·강아지·갈매기·요트를 누르면 저마다 반응합니다.
- 밤하늘을 누르면 드론쇼가 열립니다(밤 9시에도 한 번 저절로).
- 주소 뒤에 `?start=0.88`(밤 9시쯤부터), `?day=60`(하루를 1분에) 같은 값을 붙일 수 있습니다.

## 만들기

[line-art-animation](https://github.com/JDhruv14/line-art-animation) 스킬의 `lib/`(MIT)를 바탕으로 SVG와 TypeScript로 그렸습니다.

- 미리보기: `node scripts/serve.mjs` → http://localhost:5173
- 배포 파일 만들기: `node scripts/build.mjs` → `docs/` (GitHub Pages가 이 폴더를 내줍니다)
