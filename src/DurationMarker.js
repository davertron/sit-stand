import React, { useEffect, useRef, useState } from "react";

function overlap(rectA, rectB) {
    return (
        rectA.left < rectB.right &&
        rectA.right > rectB.left &&
        rectA.bottom > rectB.top &&
        rectA.top < rectB.bottom
    );
}

export default function DurationMarker({ position, formattedDuration }) {
    const [topOffset, setTopOffset] = useState(0);
    const markerRef = useRef(null);
    const OFFSET = 30;

    useEffect(() => {
        const interval = setInterval(() => {
            if (markerRef.current) {
                const markerRect = markerRef.current.getBoundingClientRect();
                const sitStandMarkers = document.querySelectorAll(
                    ".sit-stand-marker"
                );
                let intersection = false;
                for (let sitStandMarker of Array.from(sitStandMarkers)) {
                    const ssmRect = sitStandMarker.getBoundingClientRect();
                    if (overlap(markerRect, ssmRect)) {
                        intersection = true;
                        break;
                    }
                }
                if (intersection && topOffset === 0) {
                    setTopOffset(OFFSET);
                } else if (!intersection && topOffset !== 0) {
                    // Before moving it back, subtract OFFSET to see if they WOULD intersect if we moved it back...
                    const potentialRect = {
                        left: markerRect.left,
                        right: markerRect.right,
                        bottom: markerRect.bottom,
                        top: markerRect.top - OFFSET,
                    };
                    for (let sitStandMarker of Array.from(sitStandMarkers)) {
                        const ssmRect = sitStandMarker.getBoundingClientRect();
                        if (overlap(potentialRect, ssmRect)) {
                            intersection = true;
                            break;
                        }
                    }
                    if (!intersection) {
                        setTopOffset(0);
                    }
                }
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [markerRef, topOffset]);

    const top = topOffset + 50;

    return (
        <div
            ref={markerRef}
            style={{
                position: "absolute",
                left: position + "%",
                top: `${top}px`,
                transform: "translateX(-50%)",
                fontSize: "smaller",
                color: "#555",
                textAlign: "center",
            }}
        >
            {formattedDuration}
        </div>
    );
}
