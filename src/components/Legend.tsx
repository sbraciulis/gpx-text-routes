export default function Legend() {
  return (
    <section className="legend" aria-label="Pause and resume legend">
      <h2>Pause / resume cues</h2>
      <p>
        Pretty mode inserts doodles in the <em>track geometry</em> (not just pins) so they show
        up on a watch map at ~50&nbsp;ft / 15&nbsp;m zoom.
      </p>
      <div className="legend-row">
        <svg viewBox="0 0 48 40" width="48" height="40" aria-hidden="true">
          <polygon points="24,4 44,36 4,36" fill="none" stroke="#ef476f" strokeWidth="3" />
        </svg>
        <div>
          <strong>Triangle = PAUSE</strong>
          <span>Stop recording. Walk or jog the jump without tracking.</span>
        </div>
      </div>
      <div className="legend-row">
        <svg viewBox="0 0 48 40" width="48" height="40" aria-hidden="true">
          <polyline
            points="6,8 42,8 6,32 42,32"
            fill="none"
            stroke="#06d6a0"
            strokeWidth="3"
            strokeLinejoin="miter"
          />
        </svg>
        <div>
          <strong>Z = RESUME</strong>
          <span>Start recording again and run the next stroke.</span>
        </div>
      </div>
      <p className="legend-note">
        Straight dashed lines between a triangle and a Z are GPS jumps (the line Gaia draws
        while the watch is paused). <strong>Letter-to-letter joins run along the baseline</strong>{" "}
        (bottom of one glyph to the bottom of the next). Street-follow mode has no pauses — keep
        the watch running. The street map also shows a faint pretty-glyph outline so you can
        judge how well the roads still read as the typed text.
      </p>
    </section>
  );
}
