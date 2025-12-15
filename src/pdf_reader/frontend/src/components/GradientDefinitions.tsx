export const GradientDefinitions = () => (
  <svg style={{ width: 0, height: 0, position: 'absolute' }} aria-hidden="true">
    <defs>
      <linearGradient id="shimmer-grad" x1="0" y1="1" x2="1" y2="0">
        <stop offset="0%" stopColor="var(--primary-color)" />
        <stop offset="20%" stopColor="var(--primary-color)" />
        <stop offset="40%" stopColor="var(--secondary-color)" />
        <stop offset="50%" stopColor="var(--accent-color)" />
        <stop offset="60%" stopColor="var(--secondary-color)" />
        <stop offset="80%" stopColor="var(--primary-color)" />
        <stop offset="100%" stopColor="var(--primary-color)" />
        
        <animate attributeName="x1" from="-2" to="1" dur="1.5s" repeatCount="indefinite" />
        <animate attributeName="x2" from="1" to="4" dur="1.5s" repeatCount="indefinite" />
      </linearGradient>
    </defs>
  </svg>
);