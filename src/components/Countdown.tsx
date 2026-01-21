import { useState, useEffect } from "react";

interface CountdownProps {
  targetDate: Date | null;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export function Countdown({ targetDate }: CountdownProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    if (!targetDate) return;

    const calculateTimeLeft = () => {
      const difference = targetDate.getTime() - new Date().getTime();

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  if (!targetDate) {
    return (
      <div className="text-center text-muted-foreground font-serif text-xl italic">
        Data do casamento a definir
      </div>
    );
  }

  const TimeUnit = ({ value, label }: { value: number; label: string }) => (
    <div className="flex flex-col items-center">
      <div className="bg-card elegant-shadow rounded-lg p-4 md:p-6 min-w-[70px] md:min-w-[100px]">
        <span className="font-serif text-3xl md:text-5xl text-gold font-medium">
          {String(value).padStart(2, "0")}
        </span>
      </div>
      <span className="mt-2 text-xs md:text-sm uppercase tracking-widest text-muted-foreground font-sans">
        {label}
      </span>
    </div>
  );

  return (
    <div className="flex justify-center gap-3 md:gap-6">
      <TimeUnit value={timeLeft.days} label="Dias" />
      <TimeUnit value={timeLeft.hours} label="Horas" />
      <TimeUnit value={timeLeft.minutes} label="Min" />
      <TimeUnit value={timeLeft.seconds} label="Seg" />
    </div>
  );
}
