import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useT } from '../i18n';

export default function EyegamePage() {
  const navigate = useNavigate();
  const { t } = useT();

  // Load eyegame assets on mount
  useEffect(() => {
    const cssFiles = [
      '/eyegame/eyes/res/eyegame.css',
      '/eyegame/eyes/res/chrome.css',
    ];
    const links: HTMLLinkElement[] = [];
    cssFiles.forEach((href) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      document.head.appendChild(link);
      links.push(link);
    });

    const script = document.createElement('script');
    script.src = '/eyegame/eyes/res/eyegame.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      links.forEach((l) => l.remove());
      script.remove();
    };
  }, []);

  return (
    <div className="eyegame-container" style={{ width: '100%', height: '100vh' }}>
      <div className="game-over">{t('eyegame.gameOver')}</div>
      <div className="start">{t('eyegame.clickToBegin')}</div>
      <div className="game-hud">
        <div className="timer">500</div>
        <div className="score">0</div>
      </div>
    </div>
  );
}
