import React, { useState, useEffect } from 'react';

const QUOTES = [
  "형님, 오늘도 열공입니다!",
  "빅분기 마스터가 머지않았습니다!",
  "데이터는 거짓말을 하지 않습니다. 형님의 노력도 마찬가지입니다.",
  "오늘 한 줄의 코드가 내일의 합격을 만듭니다.",
  "포기하지 않는 순간, 이미 합격입니다.",
  "꾸준함이 가장 강력한 알고리즘입니다.",
  "Error는 성장의 신호입니다. 디버깅하러 가시죠!",
  "형님, 2026년 빅데이터 분석기사 주인공은 형님입니다.",
  "Just Do. 데이터 분석.",
  "어제보다 똑똑해진 오늘의 나를 믿으세요."
];

const Quote = () => {
  const [quote, setQuote] = useState('');

  useEffect(() => {
    fetch('http://goob.iptime.org:3000/api/quote')
      .then(res => res.json())
      .then(data => {
        if (data.quote) {
          setQuote(data.quote);
        }
      })
      .catch(err => console.error("Failed to fetch quote:", err));
  }, []);

  return (
    <div className="quote-container">
      <p className="quote-text">"{quote}"</p>

      <style>{`
        .quote-container {
          text-align: center;
          margin-bottom: 2rem;
          padding: 1rem;
          background: linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.1), transparent);
          border-radius: 8px;
        }
        .quote-text {
          font-size: 1.2rem;
          font-weight: 500;
          color: var(--neon-cyan);
          text-shadow: 0 0 10px rgba(0, 243, 255, 0.3);
          font-style: italic;
          margin: 0;
        }
      `}</style>
    </div>
  );
};

export default Quote;
