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

    // --- Telugu / South Songs (WITH LYRICS) ---
    {
        title: "Thalapathy Kacheri", artist: "Unknown", cover: "https://picsum.photos/200?random=26", file: "https://files.catbox.moe/l6shmk.mp3", language: "Telugu",
        lyrics: `[00:00.00] (Instrumental Music)
[00:15.00] Start the music...
[00:20.00] Thalapathy kacheri...
[00:25.00] (Beats continuing...)`
    },
    {
        title: "Chikiri Chikiri", artist: "Unknown", cover: "https://picsum.photos/200?random=33", file: "https://files.catbox.moe/y0df1k.mp3", language: "Telugu",
        lyrics: `[00:00.00] (Intro Beats)
[00:12.00] Chikiri chikiri...
[00:18.00] (Chorus starts)
[00:24.00] (Instrumental...)`
    },
    {
        title: "Chiru Chiru", artist: "Unknown", cover: "https://picsum.photos/200?random=34", file: "https://files.catbox.moe/9geklv.mp3", language: "Telugu",
        lyrics: `[00:00.00] (Beautiful Intro)
[00:14.50] Chiru chiru chiru chinukai kurisaave
[00:19.50] Manasuna madi murise varamaave
[00:24.80] Yegirey yegirey...
[00:30.00] Naa pranam yegirey...`
    },
    {
        title: "Nee Yadalo", artist: "Unknown", cover: "https://picsum.photos/200?random=35", file: "https://files.catbox.moe/6dtk2w.mp3", language: "Telugu",
        lyrics: `[00:00.00] (Melody starts)
[00:18.00] Nee yadalo naku chotu unda...
[00:24.00] Naa hrudayam neeku sonthaminda...
[00:30.00] (Music continues)`
    },
    {
        title: "Ninnu Chuse Anandamlo", artist: "Unknown", cover: "https://picsum.photos/200?random=36", file: "https://files.catbox.moe/t05z8d.mp3", language: "Telugu",
        lyrics: `[00:00.00] (Intro)
[00:10.00] Ninnu chuse anandamlo...
[00:15.50] Kannu mooste andamlo...
[00:20.00] Yegasi poyindhi naa manase...`
    },
    {
        title: "Hoyna Hoyna", artist: "Unknown", cover: "https://picsum.photos/200?random=37", file: "https://files.catbox.moe/odv2p2.mp3", language: "Telugu",
        lyrics: `[00:00.00] (Intro Beats)
[00:14.00] Hoyna hoyna...
[00:20.00] Neeto unte chaale
[00:25.00] Pranam motham neeke...`
    },
    {
        title: "Hello Rammante", artist: "Unknown", cover: "https://picsum.photos/200?random=38", file: "https://files.catbox.moe/6ic1li.mp3", language: "Telugu",
        lyrics: `[00:00.00] (Upbeat Intro)
[00:12.50] Hello rammante vachesindha
[00:17.50] Pillo nee midha naake prema
[00:22.00] (Chorus starts...)`
    },
    {
        title: "Ola Olaala Ala", artist: "Unknown", cover: "https://picsum.photos/200?random=39", file: "https://files.catbox.moe/w7b93p.mp3", language: "Telugu",
        lyrics: `[00:00.00] (Intro)
[00:15.00] Ola olaala ala...
[00:20.00] Nee roope chusthuntey ilaa...
[00:25.00] (Music...)`
    },
    {
        title: "Chilipiga", artist: "Unknown", cover: "https://picsum.photos/200?random=40", file: "https://files.catbox.moe/f8vhp1.mp3", language: "Telugu",
        lyrics: `[00:00.00] (Guitar Intro)
[00:15.00] Chilipiga choosthavala
[00:22.00] Ninukala choosedela
[00:28.00] Naa manase emo aipoyela...`
    },
    {
        title: "Nenu Nuvvantu", artist: "Unknown", cover: "https://picsum.photos/200?random=41", file: "https://files.catbox.moe/gvglj1.mp3", language: "Telugu",
        lyrics: `[00:00.00] (Soft Music)
[00:16.00] Nenu nuvvantu verai unna...
[00:22.00] Naake ee velalo neevai unna...
[00:28.00] Gundello yedo alajadi...`
    },
    {
        title: "Rooba Rooba", artist: "Unknown", cover: "https://picsum.photos/200?random=42", file: "https://files.catbox.moe/n86g5c.mp3", language: "Telugu",
        lyrics: `[00:00.00] (Fast Intro)
[00:14.20] Rooba rooba rooba rooba
[00:18.50] Hey rooba rooba rooba rooba
[00:22.10] Andamaina mabbulona chandamama
[00:27.30] Nuvve nuvve oh bhaama`
    },
    {
        title: "O Range", artist: "Unknown", cover: "https://picsum.photos/200?random=43", file: "https://files.catbox.moe/1v6ctl.mp3", language: "Telugu",
        lyrics: `[00:00.00] (Rock Intro)
[00:12.00] O Range... preminchaane
[00:18.00] Neekosam emaina chesthaane
[00:24.00] (Chorus starts...)`
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
