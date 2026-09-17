# 술 카드 근거 기록 (Task 5)

확인 시점: 2026-09
검증 기준: 스펙 §6의 4단계(존재 확인 / 영업정보 / 평판 교차 / 4인 실전성) + 술집 추가 확인(마감 시각, 차지·오토시 유무)

방법론 메모: WebSearch 세션 예산(200회)이 병렬 조사 도중 소진되어, 이후 조사는 Yahoo! JAPAN 검색 결과 스크래핑(curl+python, WebSearch 아님) 및 WebFetch, OpenStreetMap Nominatim 지오코딩으로 진행했다. Tabelog 개별 매장 페이지는 Cloudflare 봇 차단으로 직접 열람이 불가능해, 검색 스니펫에 노출되는 Tabelog 본문 발췌(영업시간·평점·리뷰 수·좌석 정보)를 근거로 사용했다. Google 지도는 JS 렌더링 페이지라 자동 스크래핑이 불가능하여, Yahoo!지도/Tabelog/Hotpepper/Retty/공식 사이트 등 복수 매체 교차확인으로 대체했다.

## 술

| id | 이름 | 근거 URL | 확인 내용 |
|---|---|---|---|
| d-01 | 간코 스시·와쇼쿠 도톤보리점 | https://tabelog.com/osaka/A2701/A270202/27001528/ , https://www.hotpepper.jp/strJ000014531/ | 타베로그 3.1(61건), 217석·개인실 10실, 12:00-22:30 연중무휴, 오토시 없음 |
| d-02 | 스미비야키 다이닝 오카게야 우메다점 | https://tabelog.com/osaka/A2701/A270101/27079231/ , https://www.hotpepper.jp/strJ001099805/ | 타베로그 3.3(313건), 86석·다다미 개인실, 오토시 410엔 확인 |
| d-03 | 히토메보레 우라난바점 | https://tabelog.com/osaka/A2701/A270202/27135873/ , https://www.hotpepper.jp/strJ003498580/ | 타베로그 3.1~3.2(262~268건), 106석·3인 이상 개인실, 17:00-24:00 |
| d-04 | 교자사카바 아메미야 | https://tabelog.com/osaka/A2701/A270202/27099140/ , https://www.hotpepper.jp/strJ004576667/ | 타베로그 3.3(191건), 61석·4인 테이블 개인실, 17:00-익일04:00 무휴 |
| d-05 | 텐마사카구라 | https://tabelog.com/osaka/A2701/A270103/27004399/ , https://www.hotpepper.jp/strJ000449169/ | 타베로그 확인, 58석(2인석7·9인석·13인석), 11:30-21:30 |
| d-06 | 사케노아나 | https://tabelog.com/osaka/A2701/A270206/27015054/ , https://retty.me/area/PRE27/ARE97/SUB9702/100001155320/ | 타베로그 3.5(500건)·야후지도 4.15(42건), 10:00-19:30, 목요일 휴무 |
| d-07 | 우오야 주추하치쿠 후쿠시마본점 | https://tabelog.com/osaka/A2701/A270108/27077333/ , https://www.hotpepper.jp/strJ001223220/ | 타베로그 3.5(597건)·핫페퍼 4.1(159건), 50석, 17:00-익일01~02시, 연중무휴 |
| d-08 | 사케노오쿠다 | https://tabelog.com/osaka/A2701/A270103/27004204/ , https://www.hotpepper.jp/strJ000807354/ | 최대 80명 입식, 10:00-13:00/15:00-21:00, 일·공휴일 휴무 |
| d-09 | 니혼슈 우나기다니 | https://tabelog.com/osaka/A2701/A270201/27085143/ , https://www.hotpepper.jp/strJ001125977/ | 타베로그 3.45(351건), 카운터+4인 테이블, 오토시 450엔, 12:00-23:30 |
| d-10 | 스탠드 오가와 | https://tabelog.com/osaka/A2701/A270202/27127637/ , https://retty.me/area/PRE27/ARE94/SUB9501/100001621408/ | 타베로그 3.3(85건), 33석·최대 24명 착석 예약, 11:00-익일04:00 무휴 |
| d-11 | 도나리노 잭과 마틸다 루쿠아오사카점 | https://tabelog.com/osaka/A2701/A270101/27118013/ , https://r.gnavi.co.jp/ar1jcuut0000/ | 타베로그 3.49(417건), 11:00-22:55(L.O.21:55/22:25) |
| d-12 | 우타게 도톤보리 | https://tabelog.com/osaka/A2701/A270202/27118722/ , https://retty.me/area/PRE27/ARE94/SUB9502/100001545482/ | 타베로그 3.6(233~234건), 40석 입식, 17:30-24:00, 화요일 휴무 |
| d-13 | 비어벨리 텐마 | https://tabelog.com/en/osaka/A2701/A270103/27064698/ , https://www.minoh-beer.jp/store/drink/ , https://beerbelly.jp/tenma/ | 미노오비어 직영 탭룸, 12m 카운터·15종 생맥주, 타베로그 최근 리뷰(2025 하반기) 확인 |
| d-14 | 크래프트비어베이스 리프 | https://tabelog.com/en/osaka/A2701/A270101/27144271/ , https://craftbeerbase.com/shops/leaf | 그랑그린 오사카 내 크래프트비어점, 2026년 최근 리뷰 다수, 11:00-23:00 |
| d-15 | 크래프트비어 걸프 | https://tabelog.com/en/osaka/A2701/A270202/27097023/ , https://hitosara.com/0032030648/map.html | 난바역 도보 3분, 4인 이상 파티 코스 있음, 화요일 휴무 |
| d-16 | WCB 다크랩 | https://tabelog.com/en/osaka/A2701/A270201/27135948/ | 34석, 캐시리스 결제, 2026년 1월 리뷰로 운영 확인, 월요일 휴무 |
| d-17 | 샷바 위스키켄큐조 | https://tabelog.com/en/osaka/A2701/A270202/27102512/ , https://www.hotpepper.jp/strJ001203182/ | 노차지 명시, 6인 소파석, 2026년 4월 리뷰, 일·월요일 휴무 |
| d-18 | 하이볼바 신사이바시 1923 | https://www.hotpepper.jp/strJ001192706/ , https://s.tabelog.com/osaka/A2701/A270201/27101744/ | 39석, 테이블차지 550엔 확인, 월요일 휴무 |
| d-19 | 하이볼바 우메다 1923 | https://tabelog.com/en/osaka/A2701/A270101/27059872/ | 타베로그 3.51(332건), 80석, 테이블차지 550엔, 2026년 최근 리뷰 다수 |
| d-20 | 바 시몬 닛폰바시점 | https://tabelog.com/en/osaka/A2701/A270202/27091409/ | 카운터 8석, 차지 500엔 확인, 2025년 3월 리뷰(표본 적음, 전화 확인 권장) |
| d-21 | 우라난바 골목 | https://kinarino.jp/cat8/36212 , https://osaka-online.jp/column/namba-tatinomiizakaya/ | 난바~닛폰바시 사이 이자카야·다치노미 밀집 골목, 다수 매체에서 소개 확인 |
| d-22 | 호젠지요코초 | https://rurubu.jp/andmore/spot/80028486 , https://retty.me/area/PRE27/ARE94/SUB9501/LND12572/LCAT1/CAT410/ | 도톤보리 인근 대표 요코초, 노포 다수 확인 |
| d-23 | 우라텐마 초친도리 | https://media.kepco.co.jp/town-and-life/17815641 , https://metronine.osaka/ja/article_tour/temma-hashigozake/ , https://travel.rakuten.co.jp/mytrip/howto/uratenma-uranamba-guide | 간사이전력 미디어·오사카메트로 공식 미디어·라쿠텐트래블에서 소개 확인 |
| d-24 | 잔잔요코초 | https://janjanyokocho.com/ , https://www.city.osaka.lg.jp/naniwa/page/0000001012.html | 공식 사이트 및 나니와구청 공식 페이지로 확인 |
| d-25 | 이소마루 스이산 도톤보리점 | https://isomaru.jp/sfp0010/ , https://tabelog.com/osaka/A2701/A270202/27074414/ | 24시간 영업 체인, 2026년 1월 임시휴점 공지로 운영 재확인 |
| d-26 | 이소마루 스이산 우메다 오하츠텐진마에점 | https://isomaru.jp/sfp0010/ , https://tabelog.com/osaka/A2701/A270101/27089204/ | 24시간 영업, 1~4층 대형 매장, 2026년 2월 임시휴점 공지로 운영 재확인 |
| d-27 | 바 시몬 도톤보리점 | https://tabelog.com/osaka/A2701/A270202/27139976/ , https://tabelog.com/kr/osaka/A2701/A270202/27139976/ | 15:00-익일03:00, 수요일 휴무, 최근 인스타그램 영업 공지로 운영 확인 |
| d-28 | 쿠 히가시신사이바시점 | https://tabelog.com/osaka/A2701/A270201/27095593/ | 18:00-익일06:00, 개인실 보유, 2026년 4월·7월 리뷰로 운영 확인 |
