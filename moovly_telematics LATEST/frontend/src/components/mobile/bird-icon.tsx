interface BirdIconProps {
  className?: string;
  size?: number;
}

export default function BirdIcon({ className = "", size = 24 }: BirdIconProps) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* EXACT copy of user's reference bird - simple and clean */}
      
      {/* Main bird body - horizontal oval */}
      <ellipse 
        cx="55" 
        cy="45" 
        rx="25" 
        ry="15" 
        fill="currentColor"
      />
      
      {/* Bird head - small circle on left */}
      <circle 
        cx="32" 
        cy="40" 
        r="12" 
        fill="currentColor"
      />
      
      {/* Simple tiny beak pointing left */}
      <path 
        d="M20 40 L12 38 L20 42 Z" 
        fill="currentColor"
      />
      
      {/* Single white eye dot */}
      <circle 
        cx="30" 
        cy="38" 
        r="3" 
        fill="white"
      />
      
      {/* Two thin straight legs */}
      <rect x="50" y="58" width="2" height="10" fill="currentColor"/>
      <rect x="60" y="58" width="2" height="10" fill="currentColor"/>
    </svg>
  );
}