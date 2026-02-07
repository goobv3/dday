import React, { useState, useEffect } from 'react';
import '../styles/theme.css';

const Countdown = ({ dDays = [] }) => {
  const [timeLefts, setTimeLefts] = useState({});

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const newTimeLefts = {};

      dDays.forEach(dDay => {
        const target = new Date(dDay.date);
        const difference = target - now;

        if (difference > 0) {
          newTimeLefts[dDay.id] = {
            days: Math.floor(difference / (1000 * 60 * 60 * 24)),
            hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
            minutes: Math.floor((difference / 1000 / 60) % 60),
            seconds: Math.floor((difference / 1000) % 60),
            isPast: false
          };
        } else {
          newTimeLefts[dDay.id] = { days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true };
        }
      });
      setTimeLefts(newTimeLefts);
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [dDays]);

  if (!dDays || dDays.length === 0) {
    return (
      <div className="countdown-container empty">
        <p>No D-Day set.</p>
        <style>{`
                    .countdown-container.empty {
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        height: 150px;
                        color: var(--text-secondary);
                        border: 1px dashed var(--border-color);
                        border-radius: 16px;
                    }
                `}</style>
      </div>
    );
  }

  const TimerBlock = ({ label, time, color, date }) => (
    <div className="timer-block" style={{ borderColor: `var(${color})` }}>
      <h3 style={{ color: `var(${color})`, textShadow: `0 0 5px var(${color})` }}>{label}</h3>
      <div className="time-display">
        {time.isPast ? (
          <div className="time-unit" style={{ width: '100%' }}>
            <span className="label" style={{ fontSize: '1.5rem', color: 'var(--text-secondary)' }}>Terminator Reached</span>
          </div>
        ) : (
          <>
            <div className="time-unit">
              <span className="number">{time.days}</span>
              <span className="label">Days</span>
            </div>
            <div className="separator">:</div>
            <div className="time-unit">
              <span className="number">{String(time.hours).padStart(2, '0')}</span>
              <span className="label">Hr</span>
            </div>
            <div className="separator">:</div>
            <div className="time-unit">
              <span className="number">{String(time.minutes).padStart(2, '0')}</span>
              <span className="label">Min</span>
            </div>
            <div className="separator">:</div>
            <div className="time-unit">
              <span className="number">{String(time.seconds).padStart(2, '0')}</span>
              <span className="label">Sec</span>
            </div>
          </>
        )}
      </div>
      <div className="target-date">
        {new Date(date).toLocaleDateString()}
      </div>
    </div>
  );

  return (
    <div className="countdown-container">
      {dDays.map(dDay => (
        <TimerBlock
          key={dDay.id}
          label={dDay.label}
          time={timeLefts[dDay.id] || { days: 0, hours: 0, minutes: 0, seconds: 0 }}
          color={dDay.color}
          date={dDay.date}
        />
      ))}

      <style>{`
        .countdown-container {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }
        .timer-block {
          background: rgba(30, 41, 59, 0.7);
          border: 1px solid;
          border-radius: 16px;
          padding: 1.5rem;
          text-align: center;
          backdrop-filter: blur(10px);
          transition: transform 0.2s;
        }
        .timer-block:hover {
          transform: translateY(-5px);
        }
        .time-display {
          display: flex;
          justify-content: center;
          align-items: center;
          font-family: 'Courier New', monospace; /* Monospace for numbers */
          font-size: 2rem;
          font-weight: 700;
          margin: 1rem 0;
          color: var(--text-primary);
        }
        .time-unit {
          display: flex;
          flex-direction: column;
          line-height: 1;
        }
        .time-unit .label {
          font-size: 0.75rem;
          color: var(--text-secondary);
          margin-top: 0.25rem;
          font-family: 'Inter', sans-serif;
        }
        .separator {
          margin: 0 0.5rem;
          padding-bottom: 1rem;
          color: var(--text-secondary);
        }
        .target-date {
          font-size: 0.9rem;
          color: var(--text-secondary);
        }
        @media (max-width: 600px) {
           .time-display {
             font-size: 1.5rem;
           }
        }
      `}</style>
    </div>
  );
};

export default Countdown;

