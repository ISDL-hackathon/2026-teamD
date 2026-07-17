'use client';

import { useState, useEffect, useRef } from 'react'; 
import dynamic from 'next/dynamic'; 
import { useRouter } from 'next/navigation';
import FooterNav from "@/components/FooterNav";
import { api } from "../../auth/api"; 
import UserHeader from "../../../components/UserHeader"; 

interface CharacterProfile {
  cid: number;
  name: string;
  img1: string;
}

const Scanner = dynamic(
  () => import('@yudiel/react-qr-scanner').then((mod) => mod.Scanner),
  { ssr: false } 
);

export default function HomePapercraftPage() {
  const router = useRouter();
  
  const [step, setStep] = useState<'start' | 'scanning' | 'starting_popup' | 'error' | 'staying' | 'ending'>('start');
  const [stayResult, setStayResult] = useState({ time: '', gb: 0, isAutomaticEnd: false });
  const [username, setUsername] = useState('ISDL メンバー');
  const [userGb, setUserGb] = useState(1389); 

  const [homeChar, setHomeChar] = useState<CharacterProfile | null>(null);
  const [mounted, setMounted] = useState(false);
  const [headerKey, setHeaderKey] = useState(0);

  // 💬 吹き出し用ステート
  const [quote, setQuote] = useState<string | null>(null);
  const [bubblePosition, setBubblePosition] = useState<any>({});
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const fetchOwnedCharacter = async () => {
    const savedCharStr = localStorage.getItem('my_home_char');
    
    if (savedCharStr) {
      try {
        const savedChar = JSON.parse(savedCharStr);
        setHomeChar({
          cid: savedChar.cid,
          name: savedChar.name,
          img1: savedChar.img1
        });
        return; 
      } catch (e) {
        console.error("ストレージのパース失敗", e);
      }
    }

    try {
      const response = await api.post('/character/owned'); 
      if (response.status === 200 && response.data && response.data.length > 0) {
        const firstChar = response.data[0];
        setHomeChar({
          cid: firstChar.cid,
          name: firstChar.characters.name,
          img1: firstChar.characters.img1
        });
      } else {
        setHomeChar({
          cid: 5, name: "阿部勝寿", img1: "https://eoaxgmhcsaowfycmuovr.supabase.co/storage/v1/object/public/character/abe_1.png"
        });
      }
    } catch (error) {
      setHomeChar({
        cid: 5, name: "阿部勝寿", img1: "https://eoaxgmhcsaowfycmuovr.supabase.co/storage/v1/object/public/character/abe_1.png"
      });
    }
  };

  useEffect(() => {
    setMounted(true);
    const startTimeStr = localStorage.getItem('stayStartTime');
    if (startTimeStr) setStep('staying');
    fetchOwnedCharacter();
  }, []);

  // 🌟 滞在開始（stayingになった瞬間）を検知して「頑張ろう！」お題を喋らせる
  useEffect(() => {
    if (step === 'staying') {
      triggerSpecialQuote('start');
    }
  }, [step]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  // 🗣️ 1. 開始時（start）や終了時（end）の「特別なセリフ」をトリガーする関数
  const triggerSpecialQuote = (type: 'start' | 'end') => {
    if (!homeChar) return;

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    // 🌟 キャラクター別の「開始時」と「終了時」のセリフデータベース
    const specialQuotes: Record<string, { start: string[]; end: string[] }> = {
      kuranuki: {
        start: [
          "よし、滞在開始だな！さあ、全力で進捗を生み出すんだ！🧑‍💻",
          "キーボードを叩く準備はいいか？気合入れていくぞ！🔥"
        ],
        end: [
          "お疲れ！よく頑張ったな。進捗が出たならイライラもしないぞ！✨",
          "作業終了だな。今日の君の頑張りは、しっかり見ていたぞ！👏"
        ]
      },
      abe: {
        start: [
          "滞在開始ですね！今日も素晴らしいクリエイティビティを発揮しましょう！🎨",
          "さあ、新しいアイデアを形にする時間の始まりです！💡"
        ],
        end: [
          "お疲れ様でした！今日の成果、とても素晴らしいものになりましたね！🌟",
          "頑張りましたね！クリエイティブな作業の後はゆっくり休んでください。🛌"
        ]
      },
      nagano: {
        start: [
          "よし、滞在開始！作業前にまずは気合のスクワットだ！いくぞ！💪",
          "今日の作業（トレーニング）開始！限界突破していこう！🏋️"
        ],
        end: [
          "滞在お疲れ！頑張った筋肉に、極上のプロテインを補給してくれ！🥛",
          "ナイスバルク！今日も最高の集中力と素晴らしい追い込みだったぞ！🔥"
        ]
      },
      futagami: {
        start: [
          "滞在を開始しましたね。今日も無理せず、自分のペースで進めましょう。👨‍🏫",
          "さあ、落ち着いて作業に取り組みましょう。応援していますよ。🐾"
        ],
        end: [
          "お疲れ様でした。集中してよく頑張ましたね。ゆっくり休んでください。😊",
          "作業終了ですね。一歩一歩、確実に研究が進んでいますよ。素晴らしい。"
        ]
      },
      hikita: {
        start: [
          "滞在開始ですね。凛とした姿勢で、今日も充実した時間にしましょう！🌸",
          "さあ、一緒に頑張りましょう。あなたが集中できるよう応援しています。☕"
        ],
        end: [
          "作業お疲れ様でした！一生懸命頑張る姿、とっても素敵でしたよ。😊",
          "滞在終了ですね。頑張った分、温かいお茶でも飲んでリフレッシュしてください。🍵"
        ]
      },
      kadoya: {
        start: [
          "滞在開始だな。ISDLのボスとして、君の今日の頑張りを見守っているぞ！👑",
          "よし、作業開始だ。集中を切らさず、ISDLの底力を見せてくれ！🚀"
        ],
        end: [
          "よくやった、お疲れ！君の頑張りがISDLを支えている。誇りに思っていいぞ！👍",
          "滞在終了だな。実に見事な作業っぷりだった。ボスとして鼻が高いぞ。"
        ]
      },
      jokei: {
        start: [
          "滞在開始ですね！僕も隣で一緒に頑張るので、何でも聞いてください！☀️",
          "さあ、作業スタートです！今日も楽しく、元気に進めていきましょう！🏃‍♂️"
        ],
        end: [
          "滞在お疲れ様でした！今日もたくさん進んで、本当にかっこよかったです！👏",
          "お疲れ様でした！頑張った後は、美味しいものでも食べてくださいね！🍔"
        ]
      },
      yoshida: {
        start: [
          "始まりましたね！気合を入れて、最高の進捗を出していきましょう！📢",
          "さあ、作業開始です！あなたの素晴らしい集中力、期待していますよ！🌟"
        ],
        end: [
          "お疲れ様でした！頑張ったあなたに、私から特大のハナマルをあげます！💮",
          "滞在お疲れ様！今日も最後までやりきって、本当にすごいです！"
        ]
      },
      default: {
        start: [
          "滞在を開始しました！今日も一歩ずつ、一緒に頑張っていきましょう！✊",
          "さあ、作業時間の始まりです！最高の集中力で駆け抜けましょう！🔥"
        ],
        end: [
          "滞在終了、お疲れ様でした！頑張った自分をたくさん褒めてあげてくださいね。🎉",
          "お疲れ様でした！一区切りつきましたね。ゆっくり脳を休めてください。💆"
        ]
      }
    };

    let charKey = 'default';
    const charName = homeChar.name;
    if (charName.includes('倉貫')) charKey = 'kuranuki';
    else if (charName.includes('阿部')) charKey = 'abe';
    else if (charName.includes('永野')) charKey = 'nagano';
    else if (charName.includes('二神')) charKey = 'futagami';
    else if (charName.includes('疋田')) charKey = 'hikita';
    else if (charName.includes('門屋')) charKey = 'kadoya';
    else if (charName.includes('淨慶')) charKey = 'jokei';
    else if (charName.includes('吉田')) charKey = 'yoshida';

    const list = specialQuotes[charKey][type];
    const randomQuote = list[Math.floor(Math.random() * list.length)];
    setQuote(randomQuote);

    // 吹き出しの位置を（顔の周りでUIの邪魔にならない安全な位置）ランダム決定
    const positions = [
      { top: '16%', left: '6%', right: 'auto' },  
      { top: '16%', right: '6%', left: 'auto' }, 
      { top: '32%', left: '5%', right: 'auto' },  
      { top: '32%', right: '5%', left: 'auto' }  
    ];
    const randomPos = positions[Math.floor(Math.random() * positions.length)];
    setBubblePosition(randomPos);

    timerRef.current = setTimeout(() => {
      setQuote(null);
    }, 5000);
  };

  // 🗣️ 2. 通常の立ち絵タップ時の日常セリフ（既存の処理）
  const handleCharacterTap = () => {
    if (!homeChar) return;

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    const quotesDatabase: Record<string, string[]> = {
      kuranuki: [
        "おいおい、進捗はどうなってるんだ？🧑‍💻",
        "早くキーボードを叩くんだ！🔥",
        "イライラさせないでくれよ〜！😜"
      ],
      abe: [
        "素晴らしいクリエイティビティですね！🎨",
        "この調子でどんどん作っていきましょう！✨",
        "良いアイデアが降ってきました！💡"
      ],
      nagano: [
        "よし、作業の合間にスクワット10回だ！🏋️",
        "筋肉もコードも裏切らない！💪",
        "プロテイン、飲みましたか？🥛"
      ],
      futagami: [
        "質問があればいつでも聞いてくださいね。👨‍🏫",
        "研究は進んでいますか？📊",
        "一歩一歩、着実に進めましょう。🐾"
      ],
      hikita: [
        "凛として、今日も一日頑張りましょう！🌸",
        "作業、応援していますね。😊",
        "一息つくのも大事ですよ。☕"
      ],
      kadoya: [
        "ボスとしての威厳を見せる時が来たな。👑",
        "ISDLの未来は君にかかっている！🚀",
        "よし、いいぞ。その調子だ。👍"
      ],
      jokei: [
        "こんにちは！今日も元気にいきましょう！☀️",
        "僕も隣で作業してます！🏃‍♂️",
        "進捗どうですか？👀"
      ],
      yoshida: [
        "お疲れ様です！進捗出していきましょう！📢",
        "ちょっと休憩しませんか？🍦",
        "頑張るあなたを応援してます！🌟"
      ],
      default: [
        "今日も一日、頑張っていきましょう！✊",
        "お疲れ様！素晴らしい集中力ですね！👏",
        "水分補給も忘れないでくださいね。🥤",
        "ちょっと伸びをして、リフレッシュしましょう！🧘"
      ]
    };

    let charKey = 'default';
    const charName = homeChar.name;
    if (charName.includes('倉貫')) charKey = 'kuranuki';
    else if (charName.includes('阿部')) charKey = 'abe';
    else if (charName.includes('永野')) charKey = 'nagano';
    else if (charName.includes('二神')) charKey = 'futagami';
    else if (charName.includes('疋田')) charKey = 'hikita';
    else if (charName.includes('門屋')) charKey = 'kadoya';
    else if (charName.includes('淨慶')) charKey = 'jokei';
    else if (charName.includes('吉田')) charKey = 'yoshida';

    const list = quotesDatabase[charKey];
    const randomQuote = list[Math.floor(Math.random() * list.length)];
    setQuote(randomQuote);

    const positions = [
      { top: '16%', left: '6%', right: 'auto' },  
      { top: '16%', right: '6%', left: 'auto' }, 
      { top: '32%', left: '5%', right: 'auto' },  
      { top: '32%', right: '5%', left: 'auto' }  
    ];
    const randomPos = positions[Math.floor(Math.random() * positions.length)];
    setBubblePosition(randomPos);

    timerRef.current = setTimeout(() => {
      setQuote(null);
    }, 5000);
  };

  const handleScanSuccess = async (text: string) => {
    try {
      const response = await api.post('/staying/start');
      if (response.status === 200 || response.data) {
        localStorage.setItem('stayStartTime', String(Date.now()));
        setStep('starting_popup');
      } else {
        setStep('error');
      }
    } catch (error) {
      console.warn("入室開始API通信エラー。デモ用にモック処理を起動します:", error);
      localStorage.setItem('stayStartTime', String(Date.now()));
      setStep('starting_popup');
    }
  };

  const handleEndStay = async () => {
    try {
      const response = await api.post('/staying/end'); 
      if (response.status === 200 && response.data) {
        const { time, gb } = response.data;
        const nextGb = userGb + gb;
        setUserGb(nextGb);
        localStorage.setItem('userGb', String(nextGb));
        setStayResult({ time: time, gb: gb, isAutomaticEnd: false });
        localStorage.removeItem('stayStartTime');
        setStep('ending');
        setHeaderKey(prev => prev + 1);
      }
    } catch (error) {
      console.warn("退室API終了エラー。デモ用にローカルでGB加算を行います:", error);
      setStayResult({ time: '5分', gb: 10, isAutomaticEnd: false });
      const nextGb = userGb + 10;
      setUserGb(nextGb);
      localStorage.setItem('userGb', String(nextGb));
      setStep('ending');
      setHeaderKey(prev => prev + 1);
    }
  };

  if (!mounted || !homeChar) return null;

  const shouldShowCharacter = step === 'start' || step === 'staying';

  return (
    <div style={{
      position: 'relative', width: '100%', maxWidth: '400px', height: '100vh', margin: '0 auto',
      backgroundImage: 
        step === 'start' ? 'url(/stay1.png)' :
        step === 'starting_popup' ? 'url(/stay2.png)' :
        step === 'error' ? 'url(/stay3.png)' :
        step === 'scanning' ? 'none' : 
        'url(/stay4.png)', 
      backgroundSize: 'cover', backgroundPosition: 'center',
      backgroundColor: step === 'scanning' ? '#000' : '#f5f5f5', 
      overflow: 'hidden'
    }}>
      
      <style>{`
        @keyframes scaleIn {
          0% { transform: scale(0.6); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        .character-container:active {
          transform: scale(0.97) translateY(4px);
        }
      `}</style>

      {step !== 'scanning' && (
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', zIndex: 100 }}>
          <UserHeader key={headerKey} />
        </div>
      )}

      {step === 'start' && (
        <div style={{
          position: 'absolute', top: '65px', left: 0, width: '100%',
          backgroundColor: 'rgba(0,0,0,0.6)', color: 'white', textAlign: 'center',
          padding: '5px 0', zIndex: 10, fontSize: '16px', fontWeight: 'bold'
        }}>
          {homeChar.name}
        </div>
      )}

      {/* ② レイヤー中面：キャラクター立ち絵 */}
      {shouldShowCharacter && (
        <div 
          onClick={handleCharacterTap} 
          className="character-container" 
          style={{
            position: 'absolute', bottom: '11vh', left: 0, width: '100%', height: '82vh',
            display: 'flex', justifyContent: 'center', alignItems: 'flex-end', zIndex: 5,
            cursor: 'pointer',
            transition: 'transform 0.15s cubic-bezier(0.175, 0.885, 0.32, 1.275)', 
            userSelect: 'none',
            WebkitTapHighlightColor: 'transparent'
          }}
        >
          <img 
            src={homeChar.img1} 
            alt={homeChar.name} 
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          />
        </div>
      )}

      {/* ③ レイヤー前面：吹き出しコンポーネント */}
      {shouldShowCharacter && quote && (
        <div 
          onClick={() => setQuote(null)} 
          style={{
            position: 'absolute',
            top: bubblePosition.top,
            left: bubblePosition.left,
            right: bubblePosition.right,
            zIndex: 100,
            backgroundColor: 'rgba(255, 255, 255, 0.96)',
            color: '#1f2937',
            padding: '12px 16px',
            borderRadius: '16px',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.18)',
            border: '2px solid #eab308', 
            fontSize: '13px',
            fontWeight: 'bold',
            maxWidth: '180px',
            pointerEvents: 'auto',
            cursor: 'pointer',
            animation: 'scaleIn 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards', 
            lineHeight: '1.4',
            userSelect: 'none'
          }}
        >
          {quote}

          <div style={{
            position: 'absolute',
            bottom: '-8px',
            left: bubblePosition.left !== 'auto' ? '24px' : 'auto',
            right: bubblePosition.right !== 'auto' ? '24px' : 'auto',
            width: '0',
            height: '0',
            borderLeft: '8px solid transparent',
            borderRight: '8px solid transparent',
            borderTop: '8px solid #eab308',
          }} />
          <div style={{
            position: 'absolute',
            bottom: '-6px',
            left: bubblePosition.left !== 'auto' ? '25px' : 'auto',
            right: bubblePosition.right !== 'auto' ? '25px' : 'auto',
            width: '0',
            height: '0',
            borderLeft: '7px solid transparent',
            borderRight: '7px solid transparent',
            borderTop: '7px solid #fff',
          }} />
        </div>
      )}

      {/* ③ レイヤー前面：滞在開始ボタン */}
      {step === 'start' && (
        <div 
          onClick={() => setStep('scanning')}
          style={{
            position: 'absolute', bottom: '22vh', left: '50%', transform: 'translateX(-50%)',
            width: '210px', height: '115px', 
            zIndex: 20, cursor: 'pointer',
            borderRadius: '50%',
            overflow: 'hidden',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: '#ffffff'
          }}
        >
          <img 
            src="/staybutton.png" 
            alt="滞在開始"
            style={{
              width: '103%', 
              height: '103%',
              objectFit: 'fill'
            }}
          />
        </div>
      )}

      {/* 📸 カメラ起動中 */}
      {step === 'scanning' && (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center', alignItems: 'center', color: 'white', zIndex: 200, position: 'relative' }}>
          <h2 style={{ marginBottom: '20px', fontSize: '16px', fontWeight: 'bold' }}>入室QRを読み取ってください</h2>
          <div style={{ width: '280px', height: '280px', marginBottom: '30px', borderRadius: '15px', overflow: 'hidden', border: '2px solid #fff' }}>
            <Scanner 
              onScan={(detectedCodes) => {
                if (detectedCodes.length > 0) {
                  handleScanSuccess(detectedCodes[0].rawValue);
                }
              }} 
              onError={(error) => console.log(error?.message)} 
            />
          </div>
          <button 
            onClick={() => setStep('start')}
            style={{ padding: '10px 30px', fontSize: '14px', backgroundColor: '#333', color: 'white', borderRadius: '20px', border: 'none' }}
          >
            キャンセル（戻る）
          </button>
        </div>
      )}

      {/* 🔴 各種ポップアップ等の判定 */}
      {step === 'starting_popup' && (
        <div onClick={() => setStep('staying')} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', cursor: 'pointer', zIndex: 150 }} />
      )}
      {step === 'error' && (
        <div onClick={() => setStep('start')} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', cursor: 'pointer', zIndex: 150 }} />
      )}

      {/* 🔴 滞在中状態 */}
      {step === 'staying' && (
        <>
          <div 
            onClick={handleEndStay}
            style={{ position: 'absolute', top: '70%', left: '20%', width: '60%', height: '12%', cursor: 'pointer', zIndex: 20 }}
          />
          <div 
            onClick={() => router.push('/stay/conversation')}
            style={{ position: 'absolute', top: '65%', right: '5%', width: '20%', height: '15%', cursor: 'pointer', zIndex: 20 }}
          />
        </>
      )}

      {/* 🔴 終了ポップアップ */}
      {step === 'ending' && (
        <div 
          onClick={() => {
            setStep('start');
            triggerSpecialQuote('end'); // 🌟 ポップアップを閉じた瞬間、お疲れ様のセリフをトリガー！
          }}
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 150 }}
        >
          <div style={{ backgroundColor: 'white', padding: '40px 20px', borderRadius: '25px', width: '80%', textAlign: 'center', fontSize: '15px', lineHeight: '1.6', color: '#333', border: '2px solid #333' }}>
            {stayResult.isAutomaticEnd ? (
              <>
                ⚠️ 滞在終了通知<br/>
                滞在時間が大幅に超過したため、自動終了しました。<br/>
                報酬として <strong>1時間分（{stayResult.gb}GB）</strong> を付与しました！
              </>
            ) : (
              <>
                🎉 滞在を終了しました！<br/>
                <strong>{stayResult.time}</strong> 滞在し、<br/>
                <strong style={{ color: '#f39c12', fontSize: '18px' }}>{stayResult.gb} GB</strong> を獲得しました。
              </>
            )}
          </div>
        </div>
      )}

      <FooterNav />
    </div>
  );
}