import React from 'react';

export default function TimeToNow({ from }) {
  let now = new Date().getTime();

    return <span>{formatDurationToHoursAndMinutes(now - from)}</span>;
}

