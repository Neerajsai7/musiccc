// songs.js - Your Master Playlist Database
const defaultSongs = [
    // --- Hindi Songs ---
    {title: "Kesariya", artist: "Brahmāstra", cover: "https://picsum.photos/200?random=1", file: "https://files.catbox.moe/mn42vj.mp3", language: "Hindi"},
    {title: "Bulleya", artist: "Sultan", cover: "https://picsum.photos/200?random=3", file: "https://files.catbox.moe/195dty.mp3", language: "Hindi"},
    {title: "Tabaahi", artist: "Toxic", cover: "https://picsum.photos/200?random=4", file: "https://files.catbox.moe/m37ohm.mp3", language: "Hindi"},
    {title: "Rai Rai Raa Raa", artist: "Toxic", cover: "https://picsum.photos/200?random=5", file: "https://files.catbox.moe/no3t0i.mp3", language: "Hindi"},
    {title: "Aari Aari", artist: "Dhurandhar-2", cover: "https://picsum.photos/200?random=7", file: "https://files.catbox.moe/4a3svo.mp3", language: "Hindi"},
    {title: "Monica", artist: "Unknown", cover: "https://picsum.photos/200?random=12", file: "https://files.catbox.moe/xcon2x.mp3", language: "Hindi"},
    {title: "Saari Dunia Jala Denge", artist: "Unknown", cover: "https://picsum.photos/200?random=13", file: "https://files.catbox.moe/gdvpfj.mp3", language: "Hindi"},
    {title: "Jehda Nasha", artist: "Unknown", cover: "https://picsum.photos/200?random=14", file: "https://files.catbox.moe/k1353t.mp3", language: "Hindi"},
    {title: "Humsafar", artist: "Unknown", cover: "https://picsum.photos/200?random=15", file: "https://files.catbox.moe/zz0p4x.mp3", language: "Hindi"},
    {title: "Milegi Milegi", artist: "Unknown", cover: "https://picsum.photos/200?random=16", file: "https://files.catbox.moe/vzerhk.mp3", language: "Hindi"},
    {title: "Dil Toh Pagal Hai (Remix)", artist: "Unknown", cover: "https://picsum.photos/200?random=17", file: "https://files.catbox.moe/61opop.mp3", language: "Hindi"},
    {title: "Gulabi Sharara", artist: "Unknown", cover: "https://picsum.photos/200?random=18", file: "https://files.catbox.moe/i8eh73.mp3", language: "Hindi"},
    {title: "Jhoom Barabar Jhoom", artist: "Unknown", cover: "https://picsum.photos/200?random=19", file: "https://files.catbox.moe/b7dufq.mp3", language: "Hindi"},
    {title: "Tera Ban Jaunga", artist: "Unknown", cover: "https://picsum.photos/200?random=20", file: "https://files.catbox.moe/refnex.mp3", language: "Hindi"},
    {title: "Tere Ishq Mein", artist: "Unknown", cover: "https://picsum.photos/200?random=21", file: "https://files.catbox.moe/sr7g2i.mp3", language: "Hindi"},
    {title: "Jhoom Sharabi", artist: "Unknown", cover: "https://picsum.photos/200?random=22", file: "https://files.catbox.moe/1ptlvm.mp3", language: "Hindi"},
    {title: "Phurr", artist: "Unknown", cover: "https://picsum.photos/200?random=23", file: "https://files.catbox.moe/4fv4ue.mp3", language: "Hindi"},
    {title: "Besharam Rang", artist: "Unknown", cover: "https://picsum.photos/200?random=24", file: "https://files.catbox.moe/8ndo0l.mp3", language: "Hindi"},
    {title: "Saibo", artist: "Unknown", cover: "https://picsum.photos/200?random=25", file: "https://files.catbox.moe/dhshrk.mp3", language: "Hindi"},
    {title: "Raanjhana", artist: "Unknown", cover: "https://picsum.photos/200?random=28", file: "https://files.catbox.moe/cellz4.mp3", language: "Hindi"},
    {title: "Haseen", artist: "Unknown", cover: "https://picsum.photos/200?random=29", file: "https://files.catbox.moe/eorv0j.mp3", language: "Hindi"},
    {title: "Ishq Jalakar", artist: "Unknown", cover: "https://picsum.photos/200?random=30", file: "https://files.catbox.moe/9xumb2.mp3", language: "Hindi"},
    {title: "Gehra Hua", artist: "Unknown", cover: "https://picsum.photos/200?random=31", file: "https://files.catbox.moe/kzlz70.mp3", language: "Hindi"},
    {title: "Laagi Re Lagan", artist: "Unknown", cover: "https://picsum.photos/200?random=32", file: "https://files.catbox.moe/n9qgtq.mp3", language: "Hindi"},
    {title: "Sajni", artist: "Unknown", cover: "https://picsum.photos/200?random=56", file: "https://files.catbox.moe/hfm9am.mp3", language: "Hindi"},
    {title: "Tum Hi Ho Bandhu", artist: "Unknown", cover: "https://picsum.photos/200?random=57", file: "https://files.catbox.moe/zmazmr.mp3", language: "Hindi"},
    {title: "Afghan Jalebi", artist: "Unknown", cover: "https://picsum.photos/200?random=58", file: "https://files.catbox.moe/3i5xoa.mp3", language: "Hindi"},
    {title: "The Breakup Song", artist: "Unknown", cover: "https://picsum.photos/200?random=59", file: "https://files.catbox.moe/p61ka4.mp3", language: "Hindi"},
    {title: "Prem Ki Naiyya", artist: "Unknown", cover: "https://picsum.photos/200?random=60", file: "https://files.catbox.moe/30r8rn.mp3", language: "Hindi"},
    {title: "Balam Pichkari", artist: "Unknown", cover: "https://picsum.photos/200?random=61", file: "https://files.catbox.moe/alyd6g.mp3", language: "Hindi"},
    {title: "Vele", artist: "Unknown", cover: "https://picsum.photos/200?random=62", file: "https://files.catbox.moe/bvalgp.mp3", language: "Hindi"},
    {title: "Tu Meri", artist: "Unknown", cover: "https://picsum.photos/200?random=63", file: "https://files.catbox.moe/j8ghay.mp3", language: "Hindi"},
    {title: "Bang Bang", artist: "Unknown", cover: "https://picsum.photos/200?random=64", file: "https://files.catbox.moe/c49jkx.mp3", language: "Hindi"},
    {title: "Khairiyat", artist: "Unknown", cover: "https://picsum.photos/200?random=65", file: "https://files.catbox.moe/ua2m9s.mp3", language: "Hindi"},

    // --- Telugu / South Songs (WITH FULL SYNCED LYRICS) ---
    {
        title: "Chilipiga", artist: "Orange", cover: "https://picsum.photos/200?random=40", file: "https://files.catbox.moe/f8vhp1.mp3", language: "Telugu",
        lyrics: `[00:00.00] (Guitar Intro)
[00:15.00] Chilipiga choosthavala
[00:22.00] Ninukala choosedela
[00:28.00] Naa manase emo aipoyela...
[00:34.00] Pranamlo pranamga marave
[00:40.00] Naa oopiri neevai nilichaave
[00:46.00] Chilipiga choosthavala
[00:52.00] Ninukala choosedela
[00:58.00] (Instrumental Interlude)
[01:15.00] Oohalalo unna ninne choosthunna
[01:21.00] Nijamlo kooda neekosam vetikanaa
[01:27.00] Naa kanti paapalo nee roopam undile
[01:33.00] Naa gunde chappudilo nee pere mrogile
[01:40.00] Ee maina ninnu vadhalanule
[01:45.00] Naa thodu nuvve kavale
[01:52.00] Chilipiga choosthavala
[01:58.00] Ninukala choosedela
[02:05.00] (Instrumental Interlude 2)
[02:30.00] Vennela vanallo neetho nadavaali
[02:36.00] Vechani kougillo ninu bandhichaali
[02:42.00] Ee kshanam ilaage aagipovaali
[02:48.00] Nee prematho nenu brathikeyaali
[02:55.00] Nuvvante naaku pichhe le
[03:00.00] Nee premalo nenu pichhonne
[03:07.00] Chilipiga choosthavala
[03:13.00] Ninukala choosedela
[03:20.00] (Outro Music)`
    },
    {
        title: "Chiru Chiru", artist: "Awara", cover: "https://picsum.photos/200?random=34", file: "https://files.catbox.moe/9geklv.mp3", language: "Telugu",
        lyrics: `[00:00.00] (Beautiful Guitar Intro)
[00:14.50] Chiru chiru chiru chinukai kurisaave
[00:19.50] Manasuna madi murise varamaave
[00:24.80] Yegirey yegirey... Naa pranam yegirey...
[00:35.00] Neeve yavvanam... yavvanam
[00:40.00] Gundello nindaave
[00:45.50] Chiru chiru chiru chinukai kurisaave
[00:50.50] Manasuna madi murise varamaave
[00:55.00] (Instrumental Interlude)
[01:30.00] Tholakarigaa naa manasuni thadipaave
[01:35.00] Alalugaa naa yedhane munchesaave
[01:40.00] Ninnu choosina aa kshanam
[01:45.00] Naa kallaallo daachaanu
[01:50.00] Nee navvula puvvulanu
[01:55.00] Naa gundello poojaichaanu
[02:00.00] Chiru chiru chiru chinukai kurisaave
[02:05.00] Manasuna madi murise varamaave
[02:10.00] (Instrumental Interlude 2)
[02:40.00] Kila kila nee navvulu vinnaanu
[02:45.00] Mila mila nee kannulu choosaanu
[02:50.00] Ennadu leni ee vinthe
[02:55.00] Naalo nene navvukunna
[03:00.00] Emaindo naake theliyade
[03:05.00] Nee premane korukunna
[03:10.00] Chiru chiru chiru chinukai kurisaave
[03:15.00] Manasuna madi murise varamaave
[03:20.00] Yegirey yegirey... Naa pranam yegirey...
[03:25.00] Neeve yavvanam... yavvanam
[03:30.00] Gundello nindaave
[03:35.00] (Outro Music)`
    },
    {
        title: "Nenu Nuvvantu", artist: "Orange", cover: "https://picsum.photos/200?random=41", file: "https://files.catbox.moe/gvglj1.mp3", language: "Telugu",
        lyrics: `[00:00.00] (Soft Intro)
[00:16.00] Nenu nuvvantu verai unna...
[00:22.00] Naake ee velalo neevai unna...
[00:28.00] Gundello yedo alajadi...
[00:34.00] Prema ani thelisindi ippudi...
[00:40.00] Nenu nuvvantu verai unna...
[00:46.00] Naake ee velalo neevai unna...
[00:52.00] (Instrumental Melody)
[01:10.00] Dooramga unna neelo unna
[01:16.00] Nee paluke naaku vinipisthundi
[01:22.00] Naa kanti venuka swapnam laaga
[01:28.00] Nee roopam nannu ventaaduthundi
[01:34.00] Naa pranam antha neekosame
[01:40.00] Ee lokam antha mana kosame
[01:46.00] Nenu nuvvantu verai unna...
[01:52.00] Naake ee velalo neevai unna...
[01:58.00] (Instrumental Interlude 2)
[02:25.00] Vennello kooda vedi undi
[02:31.00] Nee ooha naalo raguluthu unte
[02:37.00] Kannullo kooda nidura ledu
[02:43.00] Nee thalape nannu nidura lepithe
[02:49.00] Naa shwasa lona nee shwasave
[02:55.00] Naa gunde lona nee savvade
[03:01.00] Nenu nuvvantu verai unna...
[03:07.00] Naake ee velalo neevai unna...
[03:13.00] (Outro)`
    },
    {
        title: "Rooba Rooba", artist: "Orange", cover: "https://picsum.photos/200?random=42", file: "https://files.catbox.moe/n86g5c.mp3", language: "Telugu",
        lyrics: `[00:00.00] (Fast Intro)
[00:14.20] Rooba rooba rooba rooba
[00:18.50] Hey rooba rooba rooba rooba
[00:22.10] Andamaina mabbulona chandamama
[00:27.30] Nuvve nuvve oh bhaama
[00:31.50] Andukane ninnu rooba rooba andi prema
[00:36.00] Rooba rooba rooba rooba
[00:40.50] Hey rooba rooba rooba rooba
[00:45.00] Kanne choopu gaalamesthe emaipothaane
[00:50.00] Ninnu choodagane gunde jaari poyene
[00:55.00] (Instrumental Beats)
[01:15.00] Nee navvulo edo mathu undi
[01:20.00] Naa manasuni laagesthundi
[01:25.00] Nee kalla lo edo katha undi
[01:30.00] Naa vayasu ni chooresthundi
[01:35.00] Ninnu chusina prathi kshanam
[01:40.00] Aagipoda naa pranam
[01:45.00] Rooba rooba rooba rooba...
[01:50.00] Hey rooba rooba rooba rooba...
[01:55.00] (Instrumental Drop)
[02:25.00] Mallepuvvu kooda chinna pothunnadi
[02:30.00] Nee andam mundu velipothunnadi
[02:35.00] Naa gunde kooda aagipothunnadi
[02:40.00] Nee roopam chusi muchata paduthunnadi
[02:45.00] Ninnu kalisina ee kshanam
[02:50.00] Marichipoda naa pranam
[02:55.00] Rooba rooba rooba rooba...
[03:00.00] Hey rooba rooba rooba rooba...
[03:05.00] Andamaina mabbulona chandamama
[03:10.00] Nuvve nuvve oh bhaama
[03:15.00] (Outro Fade)`
    },
    {
        title: "O Range", artist: "Orange", cover: "https://picsum.photos/200?random=43", file: "https://files.catbox.moe/1v6ctl.mp3", language: "Telugu",
        lyrics: `[00:00.00] (Rock Intro)
[00:12.00] O Range... preminchaane
[00:18.00] Neekosam emaina chesthaane
[00:24.00] Prapancham antha eduraina
[00:30.00] Ninnu nenu odalaney
[00:36.00] O Range... preminchaane
[00:42.00] Neekosam emaina chesthaane
[00:48.00] (Guitar Solo)
[01:05.00] Ningi nela okkatai poyina
[01:11.00] Naa prema eppatiki maaradhey
[01:17.00] Konda kona kooda karigipoyina
[01:23.00] Nee pai naa ishtam karigipodhey
[01:29.00] Nuvvante naaku antha pichhe
[01:35.00] Nee kosam naa pranam isthaane
[01:41.00] O Range... preminchaane
[01:47.00] Neekosam emaina chesthaane
[01:53.00] (Heavy Instrumental)
[02:25.00] Gaali vaana vachi kottukupoyina
[02:31.00] Mana prema janta vidipodhey
[02:37.00] Lokam antha nannu velivesina
[02:43.00] Naa pranam ninnu vadilipodhey
[02:49.00] Nuvvu leni nenu shunyaame
[02:55.00] Nee thodai nenu untaane
[03:01.00] O Range... preminchaane
[03:07.00] Neekosam emaina chesthaane
[03:13.00] (Outro Solo)`
    },
    {
        title: "Nee Yadalo", artist: "Awara", cover: "https://picsum.photos/200?random=35", file: "https://files.catbox.moe/6dtk2w.mp3", language: "Telugu",
        lyrics: `[00:00.00] (Melody starts)
[00:18.00] Nee yadalo naaku chotu unda...
[00:24.00] Naa hrudayam neeku sonthaminda...
[00:30.00] Oohallo theli aadanu...
[00:36.00] Neethone nenu undanu...
[00:42.00] Nijamga neevu naavena...
[00:48.00] Naa sontham nuvvu kaavena...
[00:54.00] (Instrumental Solo)
[01:15.00] Kanti paapa lona daachi uncha ninne
[01:21.00] Premalona padi poina...
[01:27.00] Gundelona ninnu prematho nimpina
[01:33.00] Nee jathalo nenu aagina
[01:39.00] Naa pranam neede oh nesthama
[01:45.00] Nee premalo nenu pichhondina
[01:51.00] Nee yadalo naaku chotu unda...
[01:57.00] Naa hrudayam neeku sonthaminda...
[02:03.00] (Instrumental Interlude 2)
[02:35.00] Ningi nela ninnu choosi murisene
[02:41.00] Nee navvutho lokam merisene
[02:47.00] Chandamama kooda chinna bшена
[02:53.00] Nee andam choosi oh bhamana
[02:59.00] Nee roopam naalo mudhrinchina
[03:05.00] Nee thodai nenu brathikesthana
[03:11.00] Nee yadalo naaku chotu unda...
[03:17.00] Naa hrudayam neeku sonthaminda...
[03:23.00] (Outro Music)`
    },
    {
        title: "Thalapathy Kacheri", artist: "Unknown", cover: "https://picsum.photos/200?random=26", file: "https://files.catbox.moe/l6shmk.mp3", language: "Telugu",
        lyrics: `[00:00.00] (Instrumental Music)
[00:15.00] Start the music...
[00:20.00] Thalapathy kacheri
[00:25.00] Let's start the kacheri
[00:30.00] (Beats continuing...)
[00:45.00] Dance to the rhythm
[00:50.00] Feel the energy
[01:05.00] (Instrumental drop)
[01:20.00] Everybody on the floor
[01:25.00] Thalapathy kacheri
[01:30.00] Let's start the kacheri
[01:45.00] (Heavy Bass)
[02:10.00] Move to the beat
[02:25.00] Thalapathy kacheri
[02:40.00] (Outro Beats)`
    },
    {
        title: "Chikiri Chikiri", artist: "Unknown", cover: "https://picsum.photos/200?random=33", file: "https://files.catbox.moe/y0df1k.mp3", language: "Telugu",
        lyrics: `[00:00.00] (Intro Beats)
[00:12.00] Chikiri chikiri...
[00:18.00] Ooh lala chikiri chikiri
[00:24.00] Andamtho aadesuko
[00:30.00] Vayasutho paadesuko
[00:35.00] Chikiri chikiri...
[00:40.00] (Instrumental...)
[00:55.00] Kallatho chesey maaya
[01:00.00] Gundello yedo gaayam
[01:05.00] Naa pranam neekey sontham
[01:10.00] Nuvve naa loka kantham
[01:15.00] Chikiri chikiri...
[01:20.00] Ooh lala chikiri chikiri
[01:25.00] (Dance Interlude)
[01:50.00] Vagalatho champesthave
[01:55.00] Naa manasuni laagesthave
[02:00.00] Nee navvula vaana lona
[02:05.00] Nannu thadipesi odilesthave
[02:10.00] Chikiri chikiri...
[02:15.00] Ooh lala chikiri chikiri
[02:20.00] (Outro Music)`
    },
    {
        title: "Ninnu Chuse Anandamlo", artist: "Gang Leader", cover: "https://picsum.photos/200?random=36", file: "https://files.catbox.moe/t05z8d.mp3", language: "Telugu",
        lyrics: `[00:00.00] (Intro)
[00:10.00] Ninnu chuse anandamlo...
[00:15.50] Kannu mooste andamlo...
[00:20.00] Yegasi poyindhi naa manase...
[00:25.00] Nee kosam vethiki vethiki
[00:30.00] Alisipoyindhi naa pranam
[00:35.00] Ninnu chuse anandamlo...
[00:40.00] Kannu mooste andamlo...
[00:45.00] (Instrumental Drop)
[01:05.00] Vennela kante challanidhi
[01:10.00] Nee navvu nannu thakindhi
[01:15.00] Poola kante andamaina
[01:20.00] Nee roopam naalo nindindhi
[01:25.00] Ee janmaki nuvvu chaalu
[01:30.00] Naa hrudayam neeve le
[01:35.00] Ninnu chuse anandamlo...
[01:40.00] Kannu mooste andamlo...
[01:45.00] (Instrumental Interlude 2)
[02:15.00] Kalalo kooda ninnu chusthu
[02:20.00] Naa jeevitham gadipesta
[02:25.00] Nee jathalo nenu untu
[02:30.00] Ee lokam marchipotha
[02:35.00] Naa pranam neeve le
[02:40.00] Naa sarvam neeve le
[02:45.00] Ninnu chuse anandamlo...
[02:50.00] Kannu mooste andamlo...
[02:55.00] (Outro)`
    },
    {
        title: "Hoyna Hoyna", artist: "Gang Leader", cover: "https://picsum.photos/200?random=37", file: "https://files.catbox.moe/odv2p2.mp3", language: "Telugu",
        lyrics: `[00:00.00] (Intro Beats)
[00:14.00] Hoyna hoyna...
[00:20.00] Neeto unte chaale
[00:25.00] Pranam motham neeke...
[00:30.00] Hoyna hoyna...
[00:35.00] Naalo aasa neeve
[00:40.00] Naa shwasa kooda neeve
[00:45.00] (Music Interlude)
[01:00.00] Puvvulanti ammayi
[01:05.00] Navvutho nannu champake
[01:10.00] Andamaina ammudu
[01:15.00] Kallatho katti veyake
[01:20.00] Nee prema naaku kavaley
[01:25.00] Naa gunde neeke sonthame
[01:30.00] Hoyna hoyna...
[01:35.00] Neeto unte chaale
[01:40.00] (Instrumental Interlude 2)
[02:05.00] Mabbulanti nee kurulu
[02:10.00] Gaaliki eguruthoonte
[02:15.00] Vennelanti nee roopam
[02:20.00] Nannu pilusthoonte
[02:25.00] Naa vayasu aagademole
[02:30.00] Nee thodu nenu kavaale
[02:35.00] Hoyna hoyna...
[02:40.00] Neeto unte chaale
[02:45.00] (Outro)`
    },
    {
        title: "Hello Rammante", artist: "Orange", cover: "https://picsum.photos/200?random=38", file: "https://files.catbox.moe/6ic1li.mp3", language: "Telugu",
        lyrics: `[00:00.00] (Upbeat Intro)
[00:12.50] Hello rammante vachesindha
[00:17.50] Pillo nee midha naake prema
[00:22.00] Ye maaya chesave o preyasi
[00:27.00] Gundello nindave o urvasi
[00:32.00] Hello rammante vachesindha
[00:37.00] Pillo nee midha naake prema
[00:42.00] (Instrumental Beats)
[00:58.00] Navvutho nannu laagesave
[01:03.00] Kallatho nannu katteseve
[01:08.00] Naa manase theesukellave
[01:13.00] Nannu nenu marchipoyane
[01:18.00] Nee andam naaku pichhe kki
[01:23.00] Naa pranam neeve aipoye
[01:28.00] Hello rammante vachesindha
[01:33.00] Pillo nee midha naake prema
[01:38.00] (Instrumental Solo)
[02:05.00] Malle poola vaasana nuvve
[02:10.00] Vennela kanti roopam nuvve
[02:15.00] Naa asalu anni neeve le
[02:20.00] Ee jeevitham antha neeve le
[02:25.00] Nuvvu leka nenu brathakalene
[02:30.00] Nee thode naaku kavalene
[02:35.00] Hello rammante vachesindha
[02:40.00] Pillo nee midha naake prema
[02:45.00] (Outro)`
    },
    {
        title: "Ola Olaala Ala", artist: "Orange", cover: "https://picsum.photos/200?random=39", file: "https://files.catbox.moe/w7b93p.mp3", language: "Telugu",
        lyrics: `[00:00.00] (Intro)
[00:15.00] Ola olaala ala...
[00:20.00] Nee roope chusthuntey ilaa...
[00:25.00] Manasu yegirey mabbu laaga
[00:30.00] Gaalilo theli aadanu ilaa
[00:35.00] Ola olaala ala...
[00:40.00] Nee roope chusthuntey ilaa...
[00:45.00] (Instrumental Drop)
[01:05.00] Kalalu kooda nijam laaga
[01:10.00] Anipisthundi neetho unna vela
[01:15.00] Lokam antha kotha gaaga
[01:20.00] Kanipisthundi nee jathalona
[01:25.00] Naa vayase udikinadi le
[01:30.00] Nee premalo munigindi le
[01:35.00] Ola olaala ala...
[01:40.00] Nee roope chusthuntey ilaa...
[01:45.00] (Instrumental Interlude)
[02:15.00] Puvvullo andam antha
[02:20.00] Nee navvulo daagunnadi
[02:25.00] Vennello challadanam antha
[02:30.00] Nee chuplo daagunnadi
[02:35.00] Naa pranam neeve le
[02:40.00] Naa sarvam neeve le
[02:45.00] Ola olaala ala...
[02:50.00] Nee roope chusthuntey ilaa...
[02:55.00] (Outro)`
    },

    // --- Punjabi Songs ---
    {title: "Boyfriend", artist: "Karan Aujla", cover: "https://picsum.photos/200?random=2", file: "https://files.catbox.moe/fcllvp.mp3", language: "Punjabi"},
    {title: "You Are You Though", artist: "Karan Aujla", cover: "https://picsum.photos/200?random=9", file: "https://files.catbox.moe/hcselx.mp3", language: "Punjabi"},
    {title: "MF Gabhru", artist: "Unknown", cover: "https://picsum.photos/200?random=8", file: "https://files.catbox.moe/bc3mcw.mp3", language: "Punjabi"},
    {title: "Pal Pal", artist: "Talwinder", cover: "https://picsum.photos/200?random=27", file: "https://files.catbox.moe/x31ls3.mp3", language: "Punjabi"},
    {title: "I Really Do", artist: "Unknown", cover: "https://picsum.photos/200?random=10", file: "https://files.catbox.moe/hs231u.mp3", language: "Punjabi"},
    {title: "For A Reason", artist: "Unknown", cover: "https://picsum.photos/200?random=11", file: "https://files.catbox.moe/eq7c5h.mp3", language: "Punjabi"},

    // --- English Songs ---
    {
        title: "Shape of You", artist: "Ed Sheeran", cover: "https://picsum.photos/200?random=44", file: "https://files.catbox.moe/h6sxqt.mp3", language: "English",
        lyrics: `[00:00.00] (Instrumental Intro)
[00:09.50] The club isn't the best place to find a lover
[00:11.80] So the bar is where I go
[00:14.20] Me and my friends at the table doing shots
[00:16.50] Drinking fast and then we talk slow
[00:18.90] You come over and start up a conversation with just me
[00:21.30] And trust me I'll give it a chance now
[00:23.70] Take my hand, stop, put Van the Man on the jukebox
[00:26.10] And then we start to dance, and now I'm singing like
[00:28.50] Girl, you know I want your love
[00:30.90] Your love was handmade for somebody like me
[00:33.30] Come on now, follow my lead
[00:35.70] I may be crazy, don't mind me
[00:38.10] Say, boy, let's not talk too much
[00:40.50] Grab on my waist and put that body on me
[00:42.90] Come on now, follow my lead
[00:45.30] Come, come on now, follow my lead
[00:47.70] I'm in love with the shape of you
[00:50.10] We push and pull like a magnet do
[00:52.50] Although my heart is falling too
[00:54.90] I'm in love with your body
[00:57.30] And last night you were in my room
[00:59.70] And now my bedsheets smell like you
[01:02.10] Every day discovering something brand new
[01:04.50] I'm in love with your body`
    },
    {title: "Believer", artist: "Imagine Dragons", cover: "https://picsum.photos/200?random=45", file: "https://files.catbox.moe/zvhemy.mp3", language: "English"},
    {title: "Faded", artist: "Alan Walker", cover: "https://picsum.photos/200?random=46", file: "https://files.catbox.moe/9q4oau.mp3", language: "English"},
    {title: "Love Me Like You Do", artist: "Ellie Goulding", cover: "https://picsum.photos/200?random=47", file: "https://files.catbox.moe/xryip4.mp3", language: "English"},
    {title: "Blinding Lights", artist: "The Weeknd", cover: "https://picsum.photos/200?random=48", file: "https://files.catbox.moe/7aixbg.mp3", language: "English"},
    {title: "Sorry (Instrumental)", artist: "Justin Bieber", cover: "https://picsum.photos/200?random=49", file: "https://files.catbox.moe/a6ua2y.mp3", language: "English"},
    {title: "I Don't Care", artist: "Ed Sheeran & Justin Bieber", cover: "https://picsum.photos/200?random=50", file: "https://files.catbox.moe/6psg3z.mp3", language: "English"},
    {title: "Montero (Call Me By Your Name)", artist: "Lil Nas X", cover: "https://picsum.photos/200?random=51", file: "https://files.catbox.moe/qtycw9.mp3", language: "English"},
    {title: "Closer", artist: "The Chainsmokers", cover: "https://picsum.photos/200?random=52", file: "https://files.catbox.moe/utqgb3.mp3", language: "English"},
    {title: "Bones", artist: "Imagine Dragons", cover: "https://picsum.photos/200?random=53", file: "https://files.catbox.moe/p7r6di.mp3", language: "English"},
    {title: "Night Changes", artist: "One Direction", cover: "https://picsum.photos/200?random=54", file: "https://files.catbox.moe/86w14g.mp3", language: "English"},
    {title: "Middle of the Night", artist: "Elley Duhé", cover: "https://picsum.photos/200?random=55", file: "https://files.catbox.moe/43uyau.mp3", language: "English"}
];
