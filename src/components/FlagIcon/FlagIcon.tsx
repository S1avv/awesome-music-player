export function FlagIcon({ lang, className = "" }: { lang: string; className?: string }) {
  if (lang === "en") {
    return (
      <svg viewBox="0 0 60 30" className={`w-6 h-6 rounded-full object-cover ${className}`}>
        <clipPath id="circle-en"><circle cx="30" cy="15" r="15" /></clipPath>
        <g clipPath="url(#circle-en)">
          <path d="M0,0 H60 V30 H0 Z" fill="#012169"/>
          <path d="M0,0 L60,30 M60,0 L0,30" stroke="#FFF" strokeWidth="6"/>
          <path d="M0,0 L60,30 M60,0 L0,30" stroke="#C8102E" strokeWidth="4"/>
          <path d="M30,0 V30 M0,15 H60" stroke="#FFF" strokeWidth="10"/>
          <path d="M30,0 V30 M0,15 H60" stroke="#C8102E" strokeWidth="6"/>
        </g>
      </svg>
    );
  }

  if (lang === "ru") {
    return (
      <svg viewBox="0 0 60 30" className={`w-6 h-6 rounded-full object-cover ${className}`}>
        <clipPath id="circle-ru"><circle cx="30" cy="15" r="15" /></clipPath>
        <g clipPath="url(#circle-ru)">
          <path d="M0,0 H60 V10 H0 Z" fill="#FFF"/>
          <path d="M0,10 H60 V20 H0 Z" fill="#0039A6"/>
          <path d="M0,20 H60 V30 H0 Z" fill="#D52B1E"/>
        </g>
      </svg>
    );
  }

  if (lang === "es") {
    return (
      <svg viewBox="0 0 60 30" className={`w-6 h-6 rounded-full object-cover ${className}`}>
        <clipPath id="circle-es"><circle cx="30" cy="15" r="15" /></clipPath>
        <g clipPath="url(#circle-es)">
          <path d="M0,0 H60 V8 H0 Z" fill="#AA151B"/>
          <path d="M0,8 H60 V22 H0 Z" fill="#F1BF00"/>
          <path d="M0,22 H60 V30 H0 Z" fill="#AA151B"/>
        </g>
      </svg>
    );
  }

  if (lang === "de") {
    return (
      <svg viewBox="0 0 60 30" className={`w-6 h-6 rounded-full object-cover ${className}`}>
        <clipPath id="circle-de"><circle cx="30" cy="15" r="15" /></clipPath>
        <g clipPath="url(#circle-de)">
          <path d="M0,0 H60 V10 H0 Z" fill="#000000"/>
          <path d="M0,10 H60 V20 H0 Z" fill="#DD0000"/>
          <path d="M0,20 H60 V30 H0 Z" fill="#FFCE00"/>
        </g>
      </svg>
    );
  }

  if (lang === "fr") {
    return (
      <svg viewBox="0 0 60 30" className={`w-6 h-6 rounded-full object-cover ${className}`}>
        <clipPath id="circle-fr"><circle cx="30" cy="15" r="15" /></clipPath>
        <g clipPath="url(#circle-fr)">
          <path d="M0,0 H20 V30 H0 Z" fill="#0055A4"/>
          <path d="M20,0 H40 V30 H20 Z" fill="#FFFFFF"/>
          <path d="M40,0 H60 V30 H40 Z" fill="#EF4135"/>
        </g>
      </svg>
    );
  }

  if (lang === "uk") {
    return (
      <svg viewBox="0 0 60 30" className={`w-6 h-6 rounded-full object-cover ${className}`}>
        <clipPath id="circle-uk"><circle cx="30" cy="15" r="15" /></clipPath>
        <g clipPath="url(#circle-uk)">
          <path d="M0,0 H60 V15 H0 Z" fill="#0057B7"/>
          <path d="M0,15 H60 V30 H0 Z" fill="#FFDD00"/>
        </g>
      </svg>
    );
  }

  if (lang === "zh") {
    return (
      <svg viewBox="0 0 60 30" className={`w-6 h-6 rounded-full object-cover ${className}`}>
        <clipPath id="circle-zh"><circle cx="30" cy="15" r="15" /></clipPath>
        <g clipPath="url(#circle-zh)">
          <path d="M0,0 H60 V30 H0 Z" fill="#EE1C25"/>
          <path d="M12,4 L14.5,12 H23 L16.5,17 L19,25 L12,20 L5,25 L7.5,17 L1,12 H9.5 Z" fill="#FFFF00" transform="scale(0.8) translate(10, 5)"/>
        </g>
      </svg>
    );
  }

  if (lang === "ja") {
    return (
      <svg viewBox="0 0 60 30" className={`w-6 h-6 rounded-full object-cover ${className}`}>
        <clipPath id="circle-ja"><circle cx="30" cy="15" r="15" /></clipPath>
        <g clipPath="url(#circle-ja)">
          <path d="M0,0 H60 V30 H0 Z" fill="#FFFFFF"/>
          <circle cx="30" cy="15" r="8" fill="#BC002D"/>
        </g>
      </svg>
    );
  }

  return null;
}
