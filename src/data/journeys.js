export const JOURNEYS = [
  {
    id: 'abram',
    title: 'Abram Travels to Canaan',
    books: 'Genesis',
    description:
      'Abram departs from Ur, moves through Haran, and descends into Canaan under covenant promise.',
    points: [
      {
        lat: 30.9622,
        lon: 46.1044,
        name: 'Ur of the Chaldeans',
        history: 'A powerful Sumerian city-state on the Euphrates River.',
        lore: {
          political:
            'Ur functioned as a wealthy and highly organized center of trade and imperial administration.',
          religion:
            'Its skyline was dominated by worship of Nanna, the moon god, and by the great ziggurat complex.',
          spiritual:
            'God calling Abram out of Ur dramatizes the rupture between covenant faith and the security of empire.',
          funFact:
            'Archaeology uncovered multi-story homes with drainage systems, underscoring the comfort Abram left behind.',
        },
      },
      {
        lat: 36.8617,
        lon: 39.0142,
        name: 'Haran',
        history: 'A major trade crossroads on the Balikh River.',
        lore: {
          political:
            'Haran connected Mesopotamia to the Mediterranean and flourished on caravan movement.',
          religion:
            'The city shared the moon-god cult of Ur, making it culturally familiar to Abram’s household.',
          spiritual:
            'Haran becomes the waiting place where partial obedience gives way to total trust in God’s leading.',
          funFact:
            'Traditional beehive houses in Haran still use passive ventilation principles that have endured for centuries.',
        },
      },
      {
        lat: 32.2133,
        lon: 35.2694,
        name: 'Shechem in Canaan',
        history: 'A fortified city in the hill country of Canaan.',
        lore: {
          political:
            'Canaan was a fractured network of city-states often influenced by stronger regional powers.',
          religion:
            'Canaanite worship centered on fertility cults and territorial deities such as Baal and Asherah.',
          spiritual:
            'At Shechem, Abram responds to divine promise by building an altar in a land still ruled by other gods.',
          funFact:
            'The region’s commercial fame included the production and trade of purple dyes prized across the ancient world.',
        },
      },
    ],
    path: [
      [30.96, 46.1],
      [31.5, 45.5],
      [32.53, 44.42],
      [33.5, 43],
      [34.8, 40.5],
      [35.9, 39],
      [36.86, 39.01],
      [36.2, 37.16],
      [35.13, 36.75],
      [33.51, 36.29],
      [32.8, 35.59],
      [32.21, 35.26],
    ],
    civilizations: [
      {
        name: 'Sumeria / Babylonia',
        area: '250,000 km² / 96,500 mi²',
        color: '#f59e0b',
        bounds: [
          [33.5, 43],
          [34.5, 45.5],
          [31.5, 47.5],
          [29.5, 46],
          [31, 43.5],
        ],
      },
      {
        name: 'Old Kingdom Egypt',
        area: '400,000 km² / 154,000 mi²',
        color: '#3b82f6',
        bounds: [
          [31.5, 29.5],
          [31.5, 32.5],
          [29.5, 32.5],
          [28, 30.5],
          [28, 29.5],
        ],
      },
      {
        name: 'Hittite Sphere',
        area: '300,000 km² / 115,800 mi²',
        color: '#8b5cf6',
        bounds: [
          [39, 32],
          [39, 37],
          [37, 38],
          [37, 34],
        ],
      },
    ],
  },
  {
    id: 'exodus',
    title: 'The Exodus from Egypt',
    books: 'Exodus, Leviticus, Numbers',
    description:
      'The departure from Egypt, the wilderness journey, and the covenant geography of Sinai and Moab.',
    points: [
      {
        lat: 30.7997,
        lon: 31.8355,
        name: 'Goshen / Pi-Ramesses',
        history: 'The fertile eastern Nile delta associated with Israelite labor.',
        lore: {
          political:
            'Egypt was at imperial height and depended on vast labor systems, store cities, and military infrastructure.',
          religion:
            'The Exodus plagues confront the Egyptian pantheon by humiliating its symbols of order, river, sky, and kingship.',
          spiritual:
            'Goshen reveals both bondage and preservation: oppression is real, but so is the protective distinction of God.',
          funFact:
            'Ancient brickmaking relied on straw to strengthen the clay matrix, making the biblical labor demand especially brutal.',
        },
      },
      {
        lat: 28.5391,
        lon: 33.9748,
        name: 'Mount Sinai',
        history: 'A rugged mountain zone where covenant and law are dramatically given.',
        lore: {
          political:
            'Sinai lay between empires and tribal territories, a harsh frontier unsuited for sustaining a massive population.',
          religion:
            'Here Israel is isolated from Egypt’s idols and publicly introduced to the holiness of Yahweh.',
          spiritual:
            'The giving of Torah and the Tabernacle pattern reframes the wilderness as the birthplace of a covenant people.',
          funFact:
            'The peninsula’s water scarcity is so extreme that sustained habitation at this scale still points readers back to miracle.',
        },
      },
      {
        lat: 31.7683,
        lon: 35.7196,
        name: 'Plains of Moab',
        history: 'The eastern staging ground before entry into the land.',
        lore: {
          political:
            'Moab was both a geographic barrier and a political rival that tried to halt Israel through diplomacy and curse.',
          religion:
            'Moabite worship centered on Chemosh and was linked to cultic immorality and sacrificial violence.',
          spiritual:
            'From Moab, a renewed generation hears covenant again and looks across toward promise after discipline.',
          funFact:
            'The Mesha Stele provides one of the most famous external inscriptions connected to the world of Kings and Moab.',
        },
      },
    ],
    path: [
      [30.79, 31.83],
      [30.55, 32.09],
      [29.9, 32.5],
      [29.5, 32.8],
      [28.9, 33.3],
      [28.53, 33.97],
      [29, 34.5],
      [29.54, 34.97],
      [30.64, 34.47],
      [31, 35.5],
      [31.76, 35.71],
    ],
    civilizations: [
      {
        name: 'New Kingdom Egypt',
        area: '1,000,000 km² / 386,000 mi²',
        color: '#2563eb',
        bounds: [
          [31.5, 29],
          [31.5, 34.2],
          [29.5, 34.5],
          [27.5, 33.5],
          [27.5, 29],
        ],
      },
      {
        name: 'Edom and Moab',
        area: '15,000 km² / 5,800 mi²',
        color: '#d97706',
        bounds: [
          [31.8, 35.5],
          [31.8, 36.5],
          [29.5, 36],
          [29.5, 35.2],
        ],
      },
    ],
  },
  {
    id: 'kingdoms',
    title: 'The Kingdoms of Israel and Judah',
    books: '1-2 Kings, Prophets',
    description:
      'Northern and southern kingdom geography shaped by trade routes, fortified capitals, and contested borders.',
    points: [
      {
        lat: 33.249,
        lon: 35.652,
        name: 'Dan',
        history: 'The northern cult center established by Jeroboam.',
        lore: {
          political:
            'Dan sat at the symbolic northern edge of the kingdom and helped secure Jeroboam’s new political identity.',
          religion:
            'The site became synonymous with state-sponsored deviation through the golden calf cult.',
          spiritual:
            'Dan embodies how political expediency can become liturgical corruption and shape a kingdom’s destiny.',
          funFact:
            'Excavations at Tel Dan uncovered a large raised platform associated with royal cultic practice.',
        },
      },
      {
        lat: 31.7683,
        lon: 35.2137,
        name: 'Jerusalem',
        history: 'The capital of Judah and the city of the Temple.',
        lore: {
          political:
            'Jerusalem’s mountain setting made it defensible and central to southern royal identity.',
          religion:
            'Solomon’s Temple made the city the epicenter of priesthood, sacrifice, and covenant memory.',
          spiritual:
            'The preservation of Jerusalem sustains the Davidic line and the messianic horizon despite repeated failure.',
          funFact:
            'Hezekiah’s tunnel still bears witness to emergency engineering designed to preserve the city under siege.',
        },
      },
    ],
    path: [
      [33.24, 35.65],
      [33.01, 35.56],
      [32.7, 35.3],
      [32.27, 35.19],
      [31.93, 35.22],
      [31.76, 35.21],
    ],
    civilizations: [
      {
        name: 'Kingdom of Israel',
        area: '20,000 km² / 7,700 mi²',
        color: '#10b981',
        bounds: [
          [33.3, 35],
          [33.3, 36],
          [31.9, 35.5],
          [31.9, 34.8],
        ],
      },
      {
        name: 'Kingdom of Judah',
        area: '10,000 km² / 3,800 mi²',
        color: '#6366f1',
        bounds: [
          [31.9, 34.8],
          [31.9, 35.5],
          [30.5, 35.3],
          [30.5, 34.5],
        ],
      },
      {
        name: 'Aram-Damascus',
        area: '50,000 km² / 19,300 mi²',
        color: '#e11d48',
        bounds: [
          [34.5, 36],
          [34.5, 38],
          [33, 37],
          [33, 36],
        ],
      },
    ],
  },
  {
    id: 'galilee-ministry',
    title: 'Jesus in Galilee and Judea',
    books: 'Matthew, Mark, Luke, John',
    description:
      'A Gospel geography route connecting incarnation, proclamation, transfiguration, final ascent, crucifixion, and resurrection witness.',
    points: [
      {
        lat: 32.6996,
        lon: 35.3035,
        name: 'Nazareth',
        history: 'The Galilean village where Jesus was raised and first identified with humble origins.',
        lore: {
          political:
            'Nazareth lay within Galilee under Herodian and Roman pressure, far from Jerusalem’s priestly establishment.',
          religion:
            'Its synagogue setting frames Jesus as a Torah-shaped teacher whose authority unsettles familiar expectations.',
          spiritual:
            'The village embodies hidden preparation: the promised Messiah emerges from an overlooked place.',
          funFact:
            'Nazareth’s small scale makes Nathanael’s skeptical question in John 1 feel socially plausible rather than abstract.',
        },
      },
      {
        lat: 32.8803,
        lon: 35.5733,
        name: 'Capernaum',
        history: 'A fishing village that became a major base for Jesus’ Galilean ministry.',
        lore: {
          political:
            'Capernaum sat near trade and taxation routes, making it a vivid setting for Roman presence and local commerce.',
          religion:
            'Teaching, healing, deliverance, and Sabbath controversy converge around its synagogue and households.',
          spiritual:
            'Here kingdom authority is seen as public, embodied, and compassionate rather than merely theoretical.',
          funFact:
            'The remains of a later synagogue stand above earlier foundations associated with the town of the Gospels.',
        },
      },
      {
        lat: 32.6869,
        lon: 35.3908,
        name: 'Mount Tabor Region',
        history: 'A traditional region associated with the Transfiguration in Christian memory.',
        lore: {
          political:
            'The mountain overlooks strategic routes through lower Galilee and the Jezreel Valley.',
          religion:
            'Moses and Elijah appearing with Jesus joins Torah and Prophets to messianic glory.',
          spiritual:
            'The moment discloses glory before suffering, teaching the disciples to read the cross through revelation.',
          funFact:
            'Christian tradition remembers Tabor, while some scholars also consider Mount Hermon because of Gospel geography.',
        },
      },
      {
        lat: 31.7683,
        lon: 35.2137,
        name: 'Jerusalem',
        history: 'The city of Passover, Temple conflict, crucifixion, resurrection, and apostolic witness.',
        lore: {
          political:
            'Jerusalem was governed through a volatile mix of Roman power, priestly authority, and festival crowds.',
          religion:
            'Temple, sacrifice, kingship, prophecy, and judgment all intensify in the Passion narrative.',
          spiritual:
            'The Gospel route culminates where rejection becomes atonement and death is overturned by resurrection.',
          funFact:
            'Pilgrimage feasts could swell the city far beyond its normal population, heightening public tension.',
        },
      },
    ],
    path: [
      [32.69, 35.3],
      [32.8, 35.42],
      [32.88, 35.57],
      [32.78, 35.5],
      [32.68, 35.39],
      [32.1, 35.35],
      [31.76, 35.21],
    ],
    civilizations: [
      {
        name: 'Galilee',
        area: '3,500 km² / 1,350 mi²',
        color: '#14b8a6',
        bounds: [
          [33.1, 35.1],
          [33.1, 35.8],
          [32.55, 35.8],
          [32.55, 35.1],
        ],
      },
      {
        name: 'Judea',
        area: '5,500 km² / 2,120 mi²',
        color: '#f97316',
        bounds: [
          [32.05, 34.9],
          [32.05, 35.6],
          [31.1, 35.55],
          [31.1, 34.9],
        ],
      },
      {
        name: 'Decapolis',
        area: '18,000 km² / 6,950 mi²',
        color: '#06b6d4',
        bounds: [
          [33, 35.7],
          [33, 36.6],
          [31.7, 36.5],
          [31.7, 35.7],
        ],
      },
    ],
  },
  {
    id: 'paul-first-journey',
    title: 'Paul’s First Missionary Journey',
    books: 'Acts, Galatians',
    description:
      'Barnabas and Paul move from Antioch to Cyprus and southern Galatia, tracing the early Gentile mission.',
    points: [
      {
        lat: 36.2021,
        lon: 36.1613,
        name: 'Antioch in Syria',
        history: 'A major urban center where disciples were first called Christians and missionary sending matured.',
        lore: {
          political:
            'Antioch was one of Rome’s great eastern cities, strategically placed between Syria, Anatolia, and the Mediterranean.',
          religion:
            'Its mixed Jewish and Gentile context made it a natural launch point for gospel expansion beyond Judea.',
          spiritual:
            'Prayer, fasting, and sending show the church discerning mission as Spirit-directed rather than self-invented.',
          funFact:
            'Antioch’s cosmopolitan scale made it a fitting place for a multiethnic Christian identity to become visible.',
        },
      },
      {
        lat: 35.1856,
        lon: 33.3823,
        name: 'Salamis and Paphos, Cyprus',
        history: 'Cyprus receives synagogue proclamation and a confrontation before the Roman proconsul.',
        lore: {
          political:
            'Cyprus was a Roman senatorial province with coastal cities linked to Mediterranean traffic.',
          religion:
            'Jewish synagogue networks provided the first public hearing points for apostolic proclamation.',
          spiritual:
            'The episode at Paphos dramatizes gospel witness before both spiritual opposition and Roman authority.',
          funFact:
            'Barnabas was from Cyprus, so the journey begins in terrain already tied to one missionary’s home story.',
        },
      },
      {
        lat: 36.9167,
        lon: 30.6956,
        name: 'Perga in Pamphylia',
        history: 'A coastal gateway into the rugged interior of Asia Minor.',
        lore: {
          political:
            'Pamphylia connected maritime trade with inland roads climbing toward Pisidian Antioch.',
          religion:
            'The journey shifts from island mission to challenging inland urban centers and synagogue debates.',
          spiritual:
            'Perga marks the cost of mission, including John Mark’s departure and the perseverance required ahead.',
          funFact:
            'Ancient Perga was famous for its colonnaded streets and Hellenistic urban planning.',
        },
      },
      {
        lat: 38.3055,
        lon: 31.1909,
        name: 'Pisidian Antioch',
        history: 'A Roman colony where Paul’s synagogue sermon becomes a turning point toward Gentile inclusion.',
        lore: {
          political:
            'The colony served Roman administrative and military interests along the Via Sebaste.',
          religion:
            'Paul’s sermon retells Israel’s history as fulfilled in Jesus and provokes both belief and opposition.',
          spiritual:
            'The city becomes a visible threshold where rejection by some opens joy among Gentile hearers.',
          funFact:
            'The Roman road system made this demanding inland journey possible even through difficult terrain.',
        },
      },
      {
        lat: 37.8714,
        lon: 32.4846,
        name: 'Iconium and Lystra',
        history: 'Southern Galatian cities where signs, persecution, and church planting occur.',
        lore: {
          political:
            'These cities sat within a mixed cultural zone shaped by Roman roads, Greek language, and local Anatolian traditions.',
          religion:
            'Lystra’s Zeus and Hermes episode reveals how quickly miracles could be misread through pagan categories.',
          spiritual:
            'The mission presses on through misunderstanding, violence, encouragement, and appointed elders.',
          funFact:
            'Timothy’s later story is rooted in Lystra, tying this route to the next generation of mission leadership.',
        },
      },
    ],
    path: [
      [36.2, 36.16],
      [35.9, 35.4],
      [35.18, 33.38],
      [34.77, 32.42],
      [36.91, 30.69],
      [37.4, 30.8],
      [38.3, 31.19],
      [38.15, 31.9],
      [37.87, 32.48],
      [36.91, 30.69],
      [36.2, 36.16],
    ],
    civilizations: [
      {
        name: 'Roman Syria',
        area: '120,000 km² / 46,300 mi²',
        color: '#ef4444',
        bounds: [
          [37.2, 35.6],
          [37.2, 37.6],
          [35.2, 37.4],
          [35.2, 35.6],
        ],
      },
      {
        name: 'Cyprus',
        area: '9,251 km² / 3,572 mi²',
        color: '#22c55e',
        bounds: [
          [35.75, 32.2],
          [35.75, 34.7],
          [34.55, 34.7],
          [34.55, 32.2],
        ],
      },
      {
        name: 'South Galatia',
        area: '75,000 km² / 29,000 mi²',
        color: '#8b5cf6',
        bounds: [
          [39, 29.8],
          [39, 33.2],
          [37, 33.2],
          [37, 29.8],
        ],
      },
    ],
  },
  {
    id: 'exile-return',
    title: 'Exile and Return from Babylon',
    books: '2 Kings, Ezra, Nehemiah, Daniel',
    description:
      'A long arc from Jerusalem’s fall to Babylonian exile and the restored community returning to rebuild.',
    points: [
      {
        lat: 31.7683,
        lon: 35.2137,
        name: 'Jerusalem',
        history: 'The city falls to Babylon, yet later becomes the focus of return, rebuilding, and covenant renewal.',
        lore: {
          political:
            'Judah’s final kings navigated impossible pressure between Babylon, Egypt, and prophetic warning.',
          religion:
            'Temple destruction exposed covenant infidelity while intensifying hope for restoration beyond judgment.',
          spiritual:
            'Jerusalem is both wound and promise: judgment is severe, but God’s covenant purposes are not abandoned.',
          funFact:
            'The Babylonian destruction layer remains one of archaeology’s stark witnesses to the end of Judah’s monarchy.',
        },
      },
      {
        lat: 33.3152,
        lon: 44.3661,
        name: 'Babylon',
        history: 'The imperial capital where Judean exiles lived under foreign rule and prophetic hope was refined.',
        lore: {
          political:
            'Babylon projected power through monumental architecture, deportation policy, and imperial administration.',
          religion:
            'Exile forced Israel to confess Yahweh without land, king, or temple as visible guarantees.',
          spiritual:
            'In Babylon, faith learns lament, endurance, wisdom, and hope for a new exodus.',
          funFact:
            'Daniel’s stories place covenant fidelity inside the administrative heart of empire rather than on its margins.',
        },
      },
      {
        lat: 32.1892,
        lon: 48.2578,
        name: 'Susa',
        history: 'A Persian royal center tied to Esther, Nehemiah, and imperial permission for restoration.',
        lore: {
          political:
            'Susa represents the Persian imperial bureaucracy that could either threaten or authorize Jewish survival.',
          religion:
            'Providence works through court access, decrees, risk, and intercession rather than only overt miracle.',
          spiritual:
            'The return story shows God turning imperial paperwork into covenant mercy.',
          funFact:
            'The palace complex at Susa connects biblical narrative with the administrative geography of the Persian Empire.',
        },
      },
      {
        lat: 31.7683,
        lon: 35.2137,
        name: 'Jerusalem Rebuilt',
        history: 'Returnees rebuild altar, temple, walls, and communal identity under Ezra and Nehemiah.',
        lore: {
          political:
            'The restored community remains small and vulnerable, negotiating local hostility and Persian oversight.',
          religion:
            'Torah reading, confession, Sabbath, and worship become central markers of renewed identity.',
          spiritual:
            'Return is real but incomplete, creating longing for deeper restoration and messianic fulfillment.',
          funFact:
            'Nehemiah’s wall project combines prayer, construction logistics, security planning, and public reform.',
        },
      },
    ],
    path: [
      [31.76, 35.21],
      [32.2, 36.5],
      [33.3, 38.5],
      [34.4, 41],
      [33.31, 44.36],
      [32.7, 46],
      [32.18, 48.25],
      [33.31, 44.36],
      [34.4, 41],
      [33.3, 38.5],
      [32.2, 36.5],
      [31.76, 35.21],
    ],
    civilizations: [
      {
        name: 'Neo-Babylonian Empire',
        area: '500,000 km² / 193,000 mi²',
        color: '#a855f7',
        bounds: [
          [35, 39],
          [35, 48],
          [30, 48],
          [30, 39],
        ],
      },
      {
        name: 'Persian Heartland',
        area: '700,000 km² / 270,000 mi²',
        color: '#0ea5e9',
        bounds: [
          [34, 46],
          [34, 53],
          [28, 53],
          [28, 46],
        ],
      },
      {
        name: 'Yehud Province',
        area: '2,000 km² / 770 mi²',
        color: '#f59e0b',
        bounds: [
          [32.1, 34.9],
          [32.1, 35.5],
          [31.2, 35.5],
          [31.2, 34.9],
        ],
      },
    ],
  },
  {
    id: 'seven-churches',
    title: 'The Seven Churches of Revelation',
    books: 'Revelation',
    description:
      'John’s circular letter route through western Asia Minor, where each church receives a precise prophetic word.',
    points: [
      {
        lat: 37.939,
        lon: 27.341,
        name: 'Ephesus',
        history: 'A major port and cultic center addressed as a church with endurance but diminished first love.',
        lore: {
          political:
            'Ephesus was a prestigious Roman city with commercial power and civic identity tied to imperial loyalty.',
          religion:
            'The city was famous for Artemis worship, making exclusive allegiance to Christ publicly costly.',
          spiritual:
            'The warning calls orthodoxy and endurance back into love as the animating center of witness.',
          funFact:
            'The theater at Ephesus could hold thousands, fitting the scale of civic uproar in Acts 19.',
        },
      },
      {
        lat: 38.4237,
        lon: 27.1428,
        name: 'Smyrna',
        history: 'A loyal imperial city where the church is warned of suffering yet promised the crown of life.',
        lore: {
          political:
            'Smyrna’s imperial loyalty meant refusal to worship Caesar could bring economic and legal danger.',
          religion:
            'The letter frames poverty and affliction through resurrection hope rather than public status.',
          spiritual:
            'Faithfulness unto death is answered by the promise that the second death will not finally harm them.',
          funFact:
            'Smyrna is modern Izmir, one of the few seven-church sites with continuous urban life into the present.',
        },
      },
      {
        lat: 39.1205,
        lon: 27.1809,
        name: 'Pergamum',
        history: 'A high imperial and cultic center where the church lives near what Revelation calls Satan’s throne.',
        lore: {
          political:
            'Pergamum held deep ties to Roman authority and regional administration.',
          religion:
            'Its monumental altars, temples, and ruler-cult setting clarify Revelation’s conflict language.',
          spiritual:
            'The letter confronts compromise while honoring faithful witness under pressure.',
          funFact:
            'Pergamum’s ancient library was famous enough to be remembered alongside Alexandria in later tradition.',
        },
      },
      {
        lat: 38.3189,
        lon: 27.8839,
        name: 'Thyatira',
        history: 'A trade-guild city where faithfulness is tested by economic and religious compromise.',
        lore: {
          political:
            'Guild participation shaped local commerce, status, and communal obligation.',
          religion:
            'The letter’s imagery warns against tolerating teaching that normalizes idolatry and immorality.',
          spiritual:
            'The faithful remnant is told to hold fast until Christ comes.',
          funFact:
            'Lydia in Acts 16 came from Thyatira and traded in purple goods.',
        },
      },
      {
        lat: 38.4881,
        lon: 28.0408,
        name: 'Sardis',
        history: 'A once-great city warned that it has a reputation for life while being spiritually dead.',
        lore: {
          political:
            'Sardis carried memories of wealth and former Lydian power under Croesus.',
          religion:
            'The warning uses wakefulness language that fits a city with a history of being surprised despite strong defenses.',
          spiritual:
            'The call to wake up turns civic memory into spiritual diagnosis.',
          funFact:
            'Sardis was associated with early coinage and extraordinary ancient wealth.',
        },
      },
      {
        lat: 38.3508,
        lon: 28.5173,
        name: 'Philadelphia',
        history: 'A vulnerable city promised an open door and secure belonging in God’s temple.',
        lore: {
          political:
            'Philadelphia suffered earthquakes and instability but held strategic value as a cultural gateway eastward.',
          religion:
            'The letter emphasizes endurance, vindication, and the naming power of God over his people.',
          spiritual:
            'Weakness is not failure here; patient faith becomes the place where Christ opens what no one can shut.',
          funFact:
            'Its earthquake history makes Revelation’s promise of becoming a pillar especially resonant.',
        },
      },
      {
        lat: 37.8354,
        lon: 29.1073,
        name: 'Laodicea',
        history: 'A wealthy city rebuked for lukewarm self-sufficiency and invited to renewed fellowship.',
        lore: {
          political:
            'Laodicea was prosperous enough to rebuild after disaster with minimal outside help.',
          religion:
            'Its wealth, textiles, medicine, and water supply sharpen Revelation’s images of poverty, nakedness, blindness, and lukewarmness.',
          spiritual:
            'The severe rebuke is also intimate mercy: Christ stands at the door and calls the church to communion.',
          funFact:
            'Nearby hot springs and cold mountain water make the lukewarm image unusually local and concrete.',
        },
      },
    ],
    path: [
      [37.93, 27.34],
      [38.42, 27.14],
      [39.12, 27.18],
      [38.31, 27.88],
      [38.48, 28.04],
      [38.35, 28.51],
      [37.83, 29.1],
    ],
    civilizations: [
      {
        name: 'Roman Asia',
        area: '130,000 km² / 50,200 mi²',
        color: '#f43f5e',
        bounds: [
          [39.5, 26.5],
          [39.5, 30],
          [37.2, 30],
          [37.2, 26.5],
        ],
      },
      {
        name: 'Aegean Coast',
        area: '35,000 km² / 13,500 mi²',
        color: '#38bdf8',
        bounds: [
          [39.3, 26.2],
          [39.3, 27.5],
          [37.2, 27.5],
          [37.2, 26.2],
        ],
      },
    ],
  },
  {
    id: 'conquest-allotment',
    title: 'Joshua and the Conquest of Canaan',
    books: 'Joshua, Judges',
    description:
      'Israel crosses the Jordan, takes key hill-country and lowland centers, and begins the tribal allotment story.',
    points: [
      {
        lat: 31.8367,
        lon: 35.5504,
        name: 'Jordan Crossing',
        history: 'Israel crosses near the Jordan opposite Jericho as the wilderness generation enters Canaan.',
        lore: {
          political: 'The Jordan valley marked the transition from nomadic wilderness movement into contested city-state territory.',
          religion: 'The crossing recalls the Red Sea and frames entry into the land as covenant gift rather than military inevitability.',
          spiritual: 'The ark going before the people presents divine presence as the true vanguard of conquest.',
          funFact: 'Gilgal becomes the memorial camp where stones teach future generations to remember the crossing.',
        },
      },
      {
        lat: 31.8711,
        lon: 35.4442,
        name: 'Jericho',
        history: 'The fortified oasis city falls after ritual procession and trumpet blast.',
        lore: {
          political: 'Jericho guarded approaches from the Jordan valley into the central hill country.',
          religion: 'Rahab’s confession shows that fear of Yahweh has already reached inside Canaanite walls.',
          spiritual: 'The battle is narrated as worshipful obedience before it is narrated as military success.',
          funFact: 'Jericho is one of the oldest continuously occupied settlement areas in the world.',
        },
      },
      {
        lat: 31.9326,
        lon: 35.2617,
        name: 'Ai / Bethel Region',
        history: 'Defeat, judgment, and renewed obedience shape the early conquest narrative.',
        lore: {
          political: 'The central ridge route made this region strategically important for movement north and south.',
          religion: 'Achan’s sin shows that covenant violation within Israel threatens the whole campaign.',
          spiritual: 'Victory after repentance teaches that holiness is not peripheral to mission.',
          funFact: 'The Ai narrative is one of Scripture’s clearest examples of communal consequences from hidden sin.',
        },
      },
      {
        lat: 31.8463,
        lon: 35.1849,
        name: 'Gibeon',
        history: 'The Gibeonite treaty creates a contested alliance and sparks southern coalition warfare.',
        lore: {
          political: 'Local cities maneuvered diplomatically and militarily as Israel’s presence destabilized the region.',
          religion: 'The treaty episode tests discernment and covenant seriousness.',
          spiritual: 'Even flawed decisions are folded into God’s larger preserving work.',
          funFact: 'Gibeon was famous for its pool and later appears in Davidic-era conflict narratives.',
        },
      },
      {
        lat: 31.7683,
        lon: 35.2137,
        name: 'Jerusalem / Hill Country',
        history: 'The southern highlands remain central to later tribal and royal history.',
        lore: {
          political: 'Jerusalem remained a Jebusite stronghold until David captured it generations later.',
          religion: 'Incomplete conquest sets up the recurring Judges pattern of compromise and deliverance.',
          spiritual: 'The land promise is real, but possession requires persevering covenant faithfulness.',
          funFact: 'Joshua’s allotment lists preserve a dense map of towns that became Israel’s lived geography.',
        },
      },
    ],
    path: [
      [31.83, 35.55],
      [31.87, 35.44],
      [31.93, 35.26],
      [31.84, 35.18],
      [31.76, 35.21],
    ],
    civilizations: [
      {
        name: 'Canaanite City-States',
        area: '25,000 km² / 9,650 mi²',
        color: '#f97316',
        bounds: [
          [33.2, 34.8],
          [33.2, 35.8],
          [30.8, 35.8],
          [30.8, 34.8],
        ],
      },
      {
        name: 'Israelite Tribal Allotments',
        area: '18,000 km² / 6,950 mi²',
        color: '#22c55e',
        bounds: [
          [32.7, 34.9],
          [32.7, 35.7],
          [31.1, 35.6],
          [31.1, 34.9],
        ],
      },
    ],
  },
  {
    id: 'united-monarchy',
    title: 'David and Solomon’s United Kingdom',
    books: '1-2 Samuel, 1 Kings, 1 Chronicles',
    description:
      'The rise of Davidic kingship from Bethlehem and Hebron to Jerusalem, then Solomon’s temple-centered kingdom.',
    points: [
      {
        lat: 31.7054,
        lon: 35.2024,
        name: 'Bethlehem',
        history: 'David’s hometown and the site where Samuel anoints him.',
        lore: {
          political: 'Bethlehem was small beside Saul’s royal networks, making David’s selection politically surprising.',
          religion: 'Anointing in Bethlehem highlights God’s sight beyond outward stature.',
          spiritual: 'The shepherd king begins in obscurity before public enthronement.',
          funFact: 'Bethlehem later becomes central to messianic expectation in Micah and the Gospels.',
        },
      },
      {
        lat: 31.5326,
        lon: 35.0998,
        name: 'Hebron',
        history: 'David first reigns over Judah from Hebron before becoming king over all Israel.',
        lore: {
          political: 'Hebron was tied to patriarchal memory and southern tribal legitimacy.',
          religion: 'The city’s ancestral associations anchor David’s rule within covenant history.',
          spiritual: 'David’s path to kingship is gradual, public, and marked by waiting.',
          funFact: 'Hebron is associated with the burial place of Abraham, Sarah, Isaac, Rebekah, Jacob, and Leah.',
        },
      },
      {
        lat: 31.7683,
        lon: 35.2137,
        name: 'Jerusalem',
        history: 'David captures Jerusalem and Solomon later builds the Temple there.',
        lore: {
          political: 'Jerusalem gave David a neutral capital between northern and southern tribal interests.',
          religion: 'The ark and Temple make the city the liturgical center of Israel.',
          spiritual: 'Zion theology ties kingship, worship, and promise together.',
          funFact: 'The City of David lies on a ridge south of today’s Temple Mount platform.',
        },
      },
      {
        lat: 32.794,
        lon: 35.531,
        name: 'Megiddo',
        history: 'A strategic fortified city on international trade routes.',
        lore: {
          political: 'Megiddo controlled movement through the Jezreel Valley and linked Solomon’s kingdom to imperial trade.',
          religion: 'Fortified cities show the kingdom’s administrative reach and vulnerability to later imperial conflict.',
          spiritual: 'The splendor of Solomon’s realm also warns of the burdens of centralization.',
          funFact: 'Megiddo’s layered ruins gave rise to the term “tel” as a mound of successive cities.',
        },
      },
    ],
    path: [
      [31.7, 35.2],
      [31.53, 35.09],
      [31.76, 35.21],
      [32.08, 35.23],
      [32.79, 35.53],
    ],
    civilizations: [
      {
        name: 'United Israel',
        area: '45,000 km² / 17,400 mi²',
        color: '#eab308',
        bounds: [
          [33.3, 34.8],
          [33.3, 36.2],
          [30.4, 35.6],
          [30.4, 34.8],
        ],
      },
      {
        name: 'Philistine Plain',
        area: '6,000 km² / 2,300 mi²',
        color: '#ef4444',
        bounds: [
          [32.2, 34.3],
          [32.2, 34.9],
          [31.2, 34.9],
          [31.2, 34.3],
        ],
      },
    ],
  },
  {
    id: 'elijah-elisha',
    title: 'Elijah and Elisha in Israel',
    books: '1-2 Kings',
    description:
      'Prophetic geography from drought and confrontation to wilderness renewal and transferred prophetic ministry.',
    points: [
      {
        lat: 32.794,
        lon: 35.531,
        name: 'Jezreel Valley',
        history: 'Ahab and Jezebel’s northern kingdom world centers around fertile royal estates and conflict.',
        lore: {
          political: 'The Omride dynasty projected power through cities, alliances, and agricultural wealth.',
          religion: 'Baal worship promised fertility, making drought a direct theological confrontation.',
          spiritual: 'The prophet exposes the lie that life comes from any power other than Yahweh.',
          funFact: 'The Jezreel Valley has been a military and agricultural crossroads for millennia.',
        },
      },
      {
        lat: 32.7294,
        lon: 35.0494,
        name: 'Mount Carmel',
        history: 'Elijah confronts the prophets of Baal before Israel.',
        lore: {
          political: 'Carmel overlooked Phoenician-linked territory and the Mediterranean coast.',
          religion: 'The fire-from-heaven episode forces a public answer to divided worship.',
          spiritual: 'The contest is not spectacle alone; it calls Israel back to covenant allegiance.',
          funFact: 'Carmel’s name is associated with orchard or vineyard imagery, fitting the fertility polemic.',
        },
      },
      {
        lat: 31.7683,
        lon: 35.2137,
        name: 'Jerusalem Road / Judah',
        history: 'Elijah flees south after Jezebel’s threat.',
        lore: {
          political: 'The flight crosses kingdom boundaries and reveals the danger of prophetic opposition to royal power.',
          religion: 'The prophet’s despair follows public victory, showing that spiritual conflict continues after dramatic signs.',
          spiritual: 'God meets exhaustion with food, rest, and renewed calling.',
          funFact: 'Elijah’s journey echoes Moses through wilderness and mountain revelation.',
        },
      },
      {
        lat: 28.5391,
        lon: 33.9748,
        name: 'Horeb / Sinai',
        history: 'Elijah encounters God not in wind, earthquake, or fire, but in quiet presence.',
        lore: {
          political: 'Far from Israel’s court, the prophet receives a new commission involving kings and successors.',
          religion: 'Horeb reconnects prophetic mission with covenant origins.',
          spiritual: 'God corrects despair by revealing hidden faithfulness and future purpose.',
          funFact: 'The story deliberately replays Sinai themes in a prophetic key.',
        },
      },
    ],
    path: [
      [32.79, 35.53],
      [32.72, 35.04],
      [32.3, 34.9],
      [31.76, 35.21],
      [30.5, 34.8],
      [28.53, 33.97],
    ],
    civilizations: [
      {
        name: 'Omride Israel',
        area: '20,000 km² / 7,700 mi²',
        color: '#10b981',
        bounds: [
          [33.3, 34.8],
          [33.3, 36.2],
          [31.9, 35.6],
          [31.9, 34.8],
        ],
      },
      {
        name: 'Phoenicia',
        area: '8,000 km² / 3,100 mi²',
        color: '#06b6d4',
        bounds: [
          [34.5, 35],
          [34.5, 36],
          [32.8, 35.7],
          [32.8, 35],
        ],
      },
    ],
  },
  {
    id: 'assyrian-crisis',
    title: 'Assyria, Samaria, and Jerusalem',
    books: '2 Kings, Isaiah, Hosea, Amos',
    description:
      'The fall of the northern kingdom and Assyrian pressure on Judah from Samaria to Jerusalem.',
    points: [
      {
        lat: 32.2767,
        lon: 35.1979,
        name: 'Samaria',
        history: 'The northern capital falls to Assyria after siege and covenant collapse.',
        lore: {
          political: 'Samaria stood at the center of Israel’s royal administration and foreign alliances.',
          religion: 'Prophets interpret the fall through idolatry, injustice, and covenant infidelity.',
          spiritual: 'The exile of Israel warns that worship divorced from righteousness cannot endure.',
          funFact: 'Assyrian records describe deportation policies that reshaped conquered populations.',
        },
      },
      {
        lat: 36.34,
        lon: 43.13,
        name: 'Nineveh',
        history: 'Assyria’s imperial center represents the terror and reach of the empire.',
        lore: {
          political: 'Assyria projected power through siege warfare, tribute, deportation, and psychological intimidation.',
          religion: 'Biblical prophets place imperial arrogance under Yahweh’s judgment.',
          spiritual: 'Nineveh is both enemy city and, in Jonah, a shocking object of mercy.',
          funFact: 'Nineveh’s palace reliefs visually celebrated Assyrian military campaigns.',
        },
      },
      {
        lat: 31.7683,
        lon: 35.2137,
        name: 'Jerusalem',
        history: 'Sennacherib threatens Jerusalem during Hezekiah’s reign.',
        lore: {
          political: 'Judah faced crushing pressure after Assyria absorbed surrounding regions.',
          religion: 'Isaiah frames the crisis as a test of trust rather than merely military survival.',
          spiritual: 'Jerusalem’s deliverance teaches that empire is not ultimate, even when it surrounds the city.',
          funFact: 'Sennacherib’s prism mentions shutting Hezekiah up in Jerusalem “like a bird in a cage.”',
        },
      },
    ],
    path: [
      [32.27, 35.19],
      [33.2, 36.3],
      [34.6, 39],
      [36.34, 43.13],
      [34.6, 39],
      [33.2, 36.3],
      [31.76, 35.21],
    ],
    civilizations: [
      {
        name: 'Neo-Assyrian Empire',
        area: '1,400,000 km² / 540,000 mi²',
        color: '#dc2626',
        bounds: [
          [37.5, 35],
          [37.5, 46],
          [31.5, 46],
          [31.5, 35],
        ],
      },
      {
        name: 'Judah',
        area: '10,000 km² / 3,800 mi²',
        color: '#6366f1',
        bounds: [
          [32.1, 34.8],
          [32.1, 35.6],
          [30.7, 35.5],
          [30.7, 34.8],
        ],
      },
    ],
  },
  {
    id: 'nativity-early-life',
    title: 'Nativity and Early Life of Jesus',
    books: 'Matthew, Luke',
    description:
      'The Gospel infancy geography from Nazareth to Bethlehem, Egypt, and return to Galilee.',
    points: [
      {
        lat: 32.6996,
        lon: 35.3035,
        name: 'Nazareth',
        history: 'Mary receives Gabriel’s announcement and Jesus is later raised here.',
        lore: {
          political: 'Galilee lay under Herodian rule and was viewed with suspicion by some Judeans.',
          religion: 'The annunciation places fulfillment in an ordinary village rather than a priestly center.',
          spiritual: 'The incarnation begins with humble consent and hidden faithfulness.',
          funFact: 'Nazareth was small enough that later readers often remark on its surprising biblical importance.',
        },
      },
      {
        lat: 31.7054,
        lon: 35.2024,
        name: 'Bethlehem',
        history: 'Jesus is born in David’s city.',
        lore: {
          political: 'Roman census administration intersects with Davidic promise.',
          religion: 'Shepherds, angels, and Davidic geography frame the birth as royal good news for the humble.',
          spiritual: 'Bethlehem joins messianic expectation with vulnerable incarnation.',
          funFact: 'Bethlehem means “house of bread,” a resonance often noted in Christian reflection.',
        },
      },
      {
        lat: 30.0444,
        lon: 31.2357,
        name: 'Egypt',
        history: 'Joseph takes Mary and Jesus to Egypt to escape Herod.',
        lore: {
          political: 'Herod’s violence shows how threatened rulers respond to rival kingship.',
          religion: 'Matthew presents Jesus as recapitulating Israel’s story: out of Egypt God calls his son.',
          spiritual: 'The refuge route shows God preserving the Messiah through exile-like vulnerability.',
          funFact: 'Egypt had large Jewish communities in the Second Temple period, especially around Alexandria.',
        },
      },
      {
        lat: 32.6996,
        lon: 35.3035,
        name: 'Nazareth Return',
        history: 'The family returns to Nazareth, where Jesus grows in wisdom and stature.',
        lore: {
          political: 'The return avoids Archelaus in Judea and settles under Galilean conditions.',
          religion: 'The hidden years root Jesus in Jewish family, synagogue, and village life.',
          spiritual: 'God’s saving plan matures quietly before public ministry begins.',
          funFact: 'The title “Nazarene” becomes part of Jesus’ public identification.',
        },
      },
    ],
    path: [
      [32.69, 35.3],
      [32.1, 35.25],
      [31.7, 35.2],
      [31.0, 34.8],
      [30.04, 31.23],
      [31.0, 34.8],
      [31.7, 35.2],
      [32.69, 35.3],
    ],
    civilizations: [
      {
        name: 'Herodian Judea',
        area: '25,000 km² / 9,650 mi²',
        color: '#f59e0b',
        bounds: [
          [33.1, 34.8],
          [33.1, 35.8],
          [31.0, 35.8],
          [31.0, 34.8],
        ],
      },
      {
        name: 'Roman Egypt',
        area: '1,000,000 km² / 386,000 mi²',
        color: '#3b82f6',
        bounds: [
          [31.5, 29],
          [31.5, 33],
          [29, 33],
          [29, 29],
        ],
      },
    ],
  },
  {
    id: 'passion-resurrection',
    title: 'Passion Week and Resurrection',
    books: 'Matthew, Mark, Luke, John, Acts',
    description:
      'The final Jerusalem geography from Bethany and the Mount of Olives to trial, crucifixion, resurrection, and ascension witness.',
    points: [
      {
        lat: 31.7719,
        lon: 35.2619,
        name: 'Bethany',
        history: 'Jesus lodges near Jerusalem and is anointed before his death.',
        lore: {
          political: 'Bethany sits close enough to Jerusalem for public tension to intensify around Jesus.',
          religion: 'The anointing anticipates burial and exposes competing ideas of devotion.',
          spiritual: 'Costly love understands what calculation misses.',
          funFact: 'Bethany is also tied to Lazarus, Mary, and Martha in John’s Gospel.',
        },
      },
      {
        lat: 31.7779,
        lon: 35.2456,
        name: 'Mount of Olives',
        history: 'Jesus enters Jerusalem, teaches, prays in Gethsemane, and later ascends from this region.',
        lore: {
          political: 'The ridge overlooks the Temple, making prophetic actions and teachings visually charged.',
          religion: 'Zechariah-shaped expectation hovers over the mountain’s eschatological significance.',
          spiritual: 'Prayerful surrender on the mountain precedes the suffering of the cross.',
          funFact: 'The Mount of Olives gives one of the most dramatic views of Jerusalem’s eastern side.',
        },
      },
      {
        lat: 31.778,
        lon: 35.2354,
        name: 'Temple Courts',
        history: 'Jesus teaches, disputes, and confronts corrupt worship practices.',
        lore: {
          political: 'Temple leadership, Roman oversight, and Passover crowds create a volatile public setting.',
          religion: 'Jesus’ actions announce judgment and renewal around the symbolic center of Israel’s worship.',
          spiritual: 'The true temple theme moves toward Jesus’ own death and resurrection.',
          funFact: 'Passover could bring immense crowds into Jerusalem, intensifying every public act.',
        },
      },
      {
        lat: 31.7785,
        lon: 35.2297,
        name: 'Golgotha / Tomb Area',
        history: 'The crucifixion, burial, and resurrection are witnessed around Jerusalem.',
        lore: {
          political: 'Roman crucifixion displayed imperial warning through public shame and terror.',
          religion: 'The Gospels interpret Jesus’ death through Passover, sacrifice, kingship, and Scripture fulfillment.',
          spiritual: 'The place of execution becomes the place where sin and death are overcome.',
          funFact: 'The exact historical location is debated, but both major traditional sites preserve early Christian memory.',
        },
      },
    ],
    path: [
      [31.77, 35.26],
      [31.77, 35.24],
      [31.778, 35.235],
      [31.7785, 35.229],
      [31.77, 35.24],
    ],
    civilizations: [
      {
        name: 'Jerusalem Festival Zone',
        area: '25 km² / 9.6 mi²',
        color: '#f97316',
        bounds: [
          [31.79, 35.21],
          [31.79, 35.27],
          [31.75, 35.27],
          [31.75, 35.21],
        ],
      },
    ],
  },
  {
    id: 'paul-second-third-journeys',
    title: 'Paul’s Aegean Mission',
    books: 'Acts, 1-2 Corinthians, 1-2 Thessalonians, Philippians',
    description:
      'Paul’s Macedonia, Greece, and Ephesus routes trace the gospel through synagogues, marketplaces, homes, and urban assemblies.',
    points: [
      {
        lat: 36.2021,
        lon: 36.1613,
        name: 'Antioch in Syria',
        history: 'The sending church remains Paul’s mission base.',
        lore: {
          political: 'Antioch linked Roman Syria with eastern Mediterranean travel.',
          religion: 'A multiethnic church becomes a launch point for mission across cultures.',
          spiritual: 'Mission flows from worshiping community rather than isolated ambition.',
          funFact: 'Acts repeatedly returns to Antioch as a staging and reporting point.',
        },
      },
      {
        lat: 41.011,
        lon: 28.9784,
        name: 'Troas / Macedonian Call',
        history: 'Paul receives the vision calling him toward Macedonia.',
        lore: {
          political: 'The Aegean crossing moves the mission into strategic Roman colonies and Greek cities.',
          religion: 'Divine guidance redirects plans through closed doors and an opened vision.',
          spiritual: 'The route teaches responsiveness when the Spirit changes the itinerary.',
          funFact: 'Troas sat near legendary Troy, linking biblical travel to a famous ancient landscape.',
        },
      },
      {
        lat: 41.0082,
        lon: 24.2867,
        name: 'Philippi',
        history: 'A Roman colony where Lydia, a jailer, and their households become part of the church.',
        lore: {
          political: 'Philippi’s veteran-colony identity made Roman citizenship and loyalty especially visible.',
          religion: 'Prayer by the river, deliverance, and prison worship mark a new European mission foothold.',
          spiritual: 'Joy under pressure becomes one of Philippi’s enduring New Testament themes.',
          funFact: 'Paul’s appeal to Roman citizenship matters sharply in a colony proud of Roman legal status.',
        },
      },
      {
        lat: 40.6401,
        lon: 22.9444,
        name: 'Thessalonica',
        history: 'Paul reasons in the synagogue and a church forms amid accusation and pressure.',
        lore: {
          political: 'Thessalonica was a major city on the Via Egnatia with strong civic stakes.',
          religion: 'The claim that Jesus is king challenges both synagogue opponents and Roman political language.',
          spiritual: 'The letters to Thessalonica emphasize endurance, holiness, hope, and the Lord’s return.',
          funFact: 'The Via Egnatia connected the Adriatic to Byzantium and carried people, goods, and ideas.',
        },
      },
      {
        lat: 37.9838,
        lon: 23.7275,
        name: 'Athens',
        history: 'Paul addresses philosophers at the Areopagus.',
        lore: {
          political: 'Athens retained cultural prestige even under Roman dominance.',
          religion: 'Paul engages pagan altar, poetry, creation, repentance, and resurrection.',
          spiritual: 'The gospel can speak publicly in intellectual centers without losing its scandal.',
          funFact: 'Acts quotes Greek poetic tradition while redirecting it toward the Creator God.',
        },
      },
      {
        lat: 37.939,
        lon: 27.341,
        name: 'Ephesus',
        history: 'Paul’s extended Ephesian ministry reshapes public life and provokes conflict around Artemis worship.',
        lore: {
          political: 'Ephesus was a leading city of Roman Asia with major commercial influence.',
          religion: 'The Artemis cult shows how idolatry, economics, and civic identity can reinforce one another.',
          spiritual: 'The gospel’s power is visible when magic, fear, and commerce are reordered around Christ.',
          funFact: 'Acts 19’s theater uproar fits the scale and civic pride of ancient Ephesus.',
        },
      },
    ],
    path: [
      [36.2, 36.16],
      [37.87, 32.48],
      [39.9, 32.85],
      [41.01, 28.97],
      [40.18, 25.87],
      [41.0, 24.28],
      [40.64, 22.94],
      [37.98, 23.72],
      [37.93, 27.34],
      [36.2, 36.16],
    ],
    civilizations: [
      {
        name: 'Roman Macedonia',
        area: '70,000 km² / 27,000 mi²',
        color: '#3b82f6',
        bounds: [
          [41.6, 20.5],
          [41.6, 25.5],
          [39.5, 25.5],
          [39.5, 20.5],
        ],
      },
      {
        name: 'Achaia',
        area: '80,000 km² / 30,900 mi²',
        color: '#22c55e',
        bounds: [
          [39.5, 20.5],
          [39.5, 24.5],
          [36.5, 24.5],
          [36.5, 20.5],
        ],
      },
      {
        name: 'Roman Asia',
        area: '130,000 km² / 50,200 mi²',
        color: '#f43f5e',
        bounds: [
          [39.5, 26.5],
          [39.5, 30],
          [37.2, 30],
          [37.2, 26.5],
        ],
      },
    ],
  },
  {
    id: 'paul-to-rome',
    title: 'Paul’s Voyage to Rome',
    books: 'Acts 21-28',
    description:
      'Paul moves from Jerusalem custody through Caesarea, storm, shipwreck, Malta, and final witness in Rome.',
    points: [
      {
        lat: 31.7683,
        lon: 35.2137,
        name: 'Jerusalem',
        history: 'Paul is arrested after returning with aid and testimony from the Gentile mission.',
        lore: {
          political: 'Jerusalem’s volatile festival setting places Paul between Roman order and Jewish leadership conflict.',
          religion: 'Charges about Torah and temple purity expose tensions around Gentile inclusion.',
          spiritual: 'Paul’s suffering becomes the path by which witness moves toward Rome.',
          funFact: 'Roman intervention saves Paul from mob violence and begins the legal journey westward.',
        },
      },
      {
        lat: 32.5,
        lon: 34.9,
        name: 'Caesarea Maritima',
        history: 'Paul is held before governors and appeals to Caesar.',
        lore: {
          political: 'Caesarea was the Roman administrative center of Judea.',
          religion: 'Paul’s defenses recite resurrection hope before political rulers.',
          spiritual: 'Delay does not stop vocation; testimony continues in custody.',
          funFact: 'Herod’s harbor at Caesarea was an engineering showpiece of Roman Judea.',
        },
      },
      {
        lat: 35.1856,
        lon: 33.3823,
        name: 'Cyprus Sea Route',
        history: 'The voyage follows eastern Mediterranean shipping lanes under difficult seasonal conditions.',
        lore: {
          political: 'Roman legal transport depended on commercial ships and imperial routes.',
          religion: 'The narrative shows divine purpose operating through ordinary maritime logistics.',
          spiritual: 'Paul is a prisoner, yet becomes a prophetic stabilizing voice onboard.',
          funFact: 'Ancient sailing seasons made late autumn voyages especially dangerous.',
        },
      },
      {
        lat: 35.2401,
        lon: 24.8093,
        name: 'Crete / Fair Havens',
        history: 'Warnings about the voyage are ignored before the storm overtakes the ship.',
        lore: {
          political: 'Economic pressure to reach a better harbor overrules prudent counsel.',
          religion: 'Acts contrasts human calculation with divine assurance during crisis.',
          spiritual: 'Paul’s confidence is not optimism; it rests on the word of God.',
          funFact: 'Fair Havens is on Crete’s south coast, exposed to difficult winds.',
        },
      },
      {
        lat: 35.9375,
        lon: 14.3754,
        name: 'Malta',
        history: 'Shipwreck leads to unexpected hospitality and healing witness.',
        lore: {
          political: 'Malta sat on central Mediterranean routes between eastern provinces and Italy.',
          religion: 'Local interpretations of danger and survival are redirected by Paul’s preservation.',
          spiritual: 'God turns disaster into hospitality, healing, and witness.',
          funFact: 'Acts names the islanders’ unusual kindness as a central feature of the scene.',
        },
      },
      {
        lat: 41.9028,
        lon: 12.4964,
        name: 'Rome',
        history: 'Paul arrives in the imperial capital and proclaims the kingdom under house arrest.',
        lore: {
          political: 'Rome is the symbolic center of imperial power and the narrative horizon of Acts.',
          religion: 'Paul bears witness to Jews and Gentiles from within the capital’s legal system.',
          spiritual: 'Acts ends with the word unhindered, even while the apostle is chained.',
          funFact: 'The final word of Acts emphasizes unhindered proclamation rather than Paul’s personal freedom.',
        },
      },
    ],
    path: [
      [31.76, 35.21],
      [32.5, 34.9],
      [33.5, 34.5],
      [35.18, 33.38],
      [36.16, 29.58],
      [35.24, 24.8],
      [34.5, 20.5],
      [35.93, 14.37],
      [38.1, 13.36],
      [40.84, 14.25],
      [41.9, 12.49],
    ],
    civilizations: [
      {
        name: 'Roman Mediterranean',
        area: '2,500,000 km² / 965,000 mi²',
        color: '#ef4444',
        bounds: [
          [42.5, 12],
          [42.5, 36],
          [30.5, 36],
          [30.5, 12],
        ],
      },
      {
        name: 'Imperial Italy',
        area: '250,000 km² / 96,500 mi²',
        color: '#f59e0b',
        bounds: [
          [45, 7],
          [45, 14],
          [38, 14],
          [38, 7],
        ],
      },
    ],
  },
]
