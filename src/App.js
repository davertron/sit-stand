import React, { useEffect, useState } from "react";
import firebase from "firebase/app";
// eslint-disable-next-line
import * as firebaseui from "firebaseui";
import "firebase/firestore";

import "./App.css";
import SitStandIcon from "./SitStandIcon";
import DurationMarker from "./DurationMarker";
import EditEntryForm from "./EditEntryForm";

import {
    ArrowLeftIcon,
    ArrowRightIcon,
    Button,
    CalendarIcon,
    CircleArrowUpIcon,
    CircleArrowDownIcon,
    Pane,
    TickCircleIcon,
} from "evergreen-ui";

import {
    formatDate,
    formatDurationToHoursAndMinutes,
    getStartOfToday,
    getStartOfTodayInUTCMillis,
    isToday,
    parseStartAndEndDates,
    scale,
} from "./utils";

const MILLIS_IN_A_DAY = 86400000;

function smartGetEntries(db) {
    let { start, end } = parseStartAndEndDates();
    if (start && end) {
        return getEntries(
            db,
            new Date(parseInt(start, 10)),
            new Date(parseInt(end, 10))
        );
    } else {
        return getEntries(db);
    }
}

function getEntries(db = null, start = getStartOfToday(), end) {
    let query = db.collection("entries").where("date", ">", start);
    if (end) {
        query = query.where("date", "<", end);
    }
    return query.get().then((qs) => {
        let entries = [];
        qs.forEach((doc) => {
            entries.push({ id: doc.id, ...doc.data() });
        });

        // Convert date field to millis...for now
        entries = entries.map((e) => ({
            ...e,
            date: e.date.toDate().getTime(),
        }));
        console.log(entries);

        return entries;
    });
}

function App() {
    let [entries, setEntries] = useState([]);
    const [, setTicks] = useState(0); // This is just something to touch to cause a re-render so our timer live updates
    const [editingEntry, setEditingEntry] = useState(null);
    const [db, setDb] = useState(null);

    useEffect(() => {
        // Initialize Firebase
        firebase.initializeApp({
            apiKey: "AIzaSyCRpn2xmJUyKT4IjR5_8MTTO045s0omkpU",
            authDomain: "sit-stand-967f2.firebaseapp.com",
            databaseURL: "https://sit-stand-967f2.firebaseio.com",
            projectId: "sit-stand-967f2",
            storageBucket: "sit-stand-967f2.appspot.com",
            messagingSenderId: "213155972077",
            appId: "1:213155972077:web:9aa1d811fc8e1bd5b15de4",
            measurementId: "G-10G81RB4N4",
        });

        firebase.auth().onAuthStateChanged((user) => {
            if (user) {
                //console.log(user);
                const db = firebase.firestore();
                setDb(db);
                window.__db = db;
            } else {
                const provider = new firebase.auth.GoogleAuthProvider();

                firebase
                    .auth()
                    .signInWithPopup(provider)
                    .then((result) => {
                        // This gives you a Google Access Token. You can use it to access the Google API.
                        //var token = result.credential.accessToken;
                        // The signed-in user info.
                        //var user = result.user;

                        const db = firebase.firestore();
                        setDb(db);
                    })
                    .catch((error) => {
                        console.error(error);
                        // Handle Errors here.
                        //let errorCode = error.code;
                        //let errorMessage = error.message;
                        // The email of the user's account used.
                        //let email = error.email;
                        // The firebase.auth.AuthCredential type that was used.
                        //let credential = error.credential;
                        // ...
                    });
            }
        });
    }, []);

    let date;
    let { start } = parseStartAndEndDates(window.location.search);
    if (start) {
        date = new Date(parseInt(start, 10));
    } else {
        date = new Date();
    }

    const isCurrentDateToday = isToday(date);
    const formattedDate = isToday(date) ? "Today" : formatDate(date);

    useEffect(() => {
        let intervalId = setInterval(() => setTicks((s) => (s += 1)), 30000); // We show time in minutes so update every 30 seconds.

        return () => clearInterval(intervalId);
    }, []);

    useEffect(() => {
        if (db) {
            smartGetEntries(db).then(setEntries);
            let { start } = parseStartAndEndDates();

            // This checks every 100 ms to handle when we change dates...
            let dateIntervalId = setInterval(() => {
                let { start: s } = parseStartAndEndDates();
                if (s && s !== start) {
                    start = s;
                    smartGetEntries(db).then(setEntries);
                }
            }, 100);

            // This checks every 30 seconds to poll for new data
            let dataIntervalId = setInterval(() => {
                    smartGetEntries(db).then(setEntries);
            }, 30000);

            return () => {
                clearInterval(dateIntervalId)
                clearInterval(dataIntervalId)
            };
        }
    }, [db]);

    function addEntry(type) {
        let now = new Date();
        let entryDate;
        if (isCurrentDateToday) {
            entryDate = now;
        } else {
            // date is set above and is the date based on start in the URL
            let sameTimeOnDay = new Date(date.getTime());
            sameTimeOnDay.setHours(now.getHours());
            sameTimeOnDay.setMinutes(now.getMinutes());
            entryDate = sameTimeOnDay;
            //time = sameTimeOnDay.getTime();
        }
        db.collection("entries")
            .add({
                date: entryDate,
                type,
            })
            .then(() => smartGetEntries(db))
            .then(setEntries);
    }

    function updateEntry({ date, id, type }) {
        const entryRef = db.collection("entries").doc(id);
        entryRef
            .update({ date, type })
            .then(() => smartGetEntries(db))
            .then((entries) => {
                setEntries(entries);
                setEditingEntry(null);
            });
    }

    function deleteEntry({ id }) {
        db.collection("entries")
            .doc(id)
            .delete()
            .then(() => smartGetEntries(db))
            .then((entries) => {
                setEntries(entries);
                setEditingEntry(null);
            });
    }

    function goToToday() {
        // TODO: Ideally we would not refresh the page here, but the logic I
        // have for detecting start date as today is kind of faulty (see other
        // TODO above in useEffect) so this will do for now
        window.location.href =
            window.location.origin +
            window.location.pathname
    }

    function goBackOneDay() {
        let startOfPrevious;
        let endOfPrevious;
        let { start, end } = parseStartAndEndDates();
        if (start && end) {
            startOfPrevious = parseInt(start, 10) - MILLIS_IN_A_DAY;
            endOfPrevious = parseInt(end, 10) - MILLIS_IN_A_DAY;
        } else {
            let startOfToday = getStartOfTodayInUTCMillis();
            startOfPrevious = startOfToday - MILLIS_IN_A_DAY;
            endOfPrevious = startOfToday - 1000;
        }

        window.history.pushState(
            {},
            null,
            window.location.origin +
            window.location.pathname +
            `?start=${startOfPrevious}&end=${endOfPrevious}`
        );
    }

    function goForwardOneDay() {
        let startOfPrevious;
        let endOfPrevious;
        if (/start/.test(window.location.search)) {
            let matches = /start=(\d+)&end=(\d+)/.exec(window.location.search);
            if (matches && matches.length === 3) {
                startOfPrevious = parseInt(matches[1], 10) + MILLIS_IN_A_DAY;
                endOfPrevious = parseInt(matches[2], 10) + MILLIS_IN_A_DAY;
            }
        }

        if (startOfPrevious && endOfPrevious) {
            window.history.pushState(
                {},
                null,
                window.location.origin +
                window.location.pathname +
                `?start=${startOfPrevious}&end=${endOfPrevious}`
            );
        }
    }

    let lastEntry = entries.slice(-1).pop();
    if (isCurrentDateToday && lastEntry && lastEntry.type !== "DONE") {
        lastEntry = { date: Date.now(), type: "NOW" };
        entries = [...entries, lastEntry];
    }
    const startTime = entries.length > 0 ? entries[0].date : 0;
    let endTime = lastEntry && lastEntry.date;

    const totalDuration = endTime - startTime;

    // Let's calculate a bunch of stuff
    // 1. Calculate stats like total sit time vs. stand time
    // 2. Calculate positions of each entry on the timeline
    // 3. Calculate the label text and positions for the duration markers
    let totalSitTime = 0;
    let totalStandTime = 0;
    const s = scale([startTime, endTime], [0, 100]);
    const sitStandMarkers = [];
    const durationMarkers = [];
    for (let i = 0; i < entries.length; i++) {
        const e = entries[i];
        // 1
        let duration = 0;
        let nextTime;
        if (i === entries.length - 1) {
            if (e.type !== "DONE") {
                nextTime = Date.now();
            } else {
                nextTime = e.date;
            }
        } else {
            nextTime = entries[i + 1].date;
        }
        duration = nextTime - e.date;
        if (e.type === "SIT") {
            totalSitTime += duration;
        } else {
            totalStandTime += duration;
        }
        // 2
        sitStandMarkers.push({
            entry: e,
            position: s(e.date),
        });
        // 3
        if (i < entries.length - 1) {
            const halfWayBetween = e.date + duration / 2;
            durationMarkers.push({
                position: s(halfWayBetween),
                duration,
                formattedDuration: formatDurationToHoursAndMinutes(
                    duration,
                    true
                ),
            });
        }
    }
    let totalSitPercent = totalSitTime / totalDuration;
    let totalStandPercent = totalStandTime / totalDuration;

    let statStyles = {
        display: "inline-block",
        position: "relative",
        border: "1px solid black",
        boxSizing: "border-box",
        textAlign: "center",
        backgroundColor: "black",
        color: "white",
        padding: "8px",
    };

    return (
        <Pane padding="16px">
            <h2>Entries for {formattedDate}</h2>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div>
                    <Button onClick={() => addEntry("SIT")} height={24}>
                        <CircleArrowDownIcon color="danger" marginRight="4px" />
                        Sit
                    </Button>{" "}
                    <Button onClick={() => addEntry("STAND")} height={24}>
                        <CircleArrowUpIcon color="success" marginRight="4px" />
                        Stand
                    </Button>{" "}
                    <Button onClick={() => addEntry("DONE")} height={24}>
                        <TickCircleIcon color="success" marginRight="4px" />
                        Done
                    </Button>
                </div>
                <Pane display="flex">
                    <Button
                        onClick={() => goToToday()}
                        height={24}
                        marginRight="4px"
                    >
                        <CalendarIcon marginRight="4px" />
                        Today
                    </Button>
                    <Button
                        onClick={() => goBackOneDay()}
                        height={24}
                        marginRight="4px"
                    >
                        <ArrowLeftIcon marginRight="4px" />
                        Previous Day
                    </Button>
                    <Button
                        onClick={() => goForwardOneDay()}
                        height={24}
                        disabled={isCurrentDateToday}
                    >
                        Next Day <ArrowRightIcon marginLeft="4px" />
                    </Button>
                </Pane>
            </div>
            <div style={{ margin: "10px auto" }}>
                <div
                    style={{
                        ...statStyles,
                        width: totalSitPercent * 100 + "%",
                    }}
                >
                    <div>Sit</div>
                    <div>{formatDurationToHoursAndMinutes(totalSitTime)}</div>
                    <div
                        style={{
                            position: "absolute",
                            right: "8px",
                            top: "50%",
                            marginTop: "-12px",
                            fontSize: "24px",
                        }}
                    >
                        {Math.round(totalSitPercent * 100) + "%"}
                    </div>
                </div>
                <div
                    style={{
                        ...statStyles,
                        width: totalStandPercent * 100 + "%",
                        backgroundColor: "white",
                        color: "black",
                    }}
                >
                    <div>Stand</div>
                    <div>{formatDurationToHoursAndMinutes(totalStandTime)}</div>
                    <div
                        style={{
                            position: "absolute",
                            left: "8px",
                            top: "50%",
                            marginTop: "-12px",
                            fontSize: "24px",
                        }}
                    >
                        {Math.round(totalStandPercent * 100) + "%"}
                    </div>
                </div>
            </div>
            <Pane height="100px" width="96%" margin="auto" position="relative">
                <div
                    style={{
                        height: "8px",
                        backgroundColor: "black",
                        position: "relative",
                        top: "36px",
                    }}
                />
                {sitStandMarkers.map((marker, i) => {
                    let isLast = i === sitStandMarkers.length - 1;
                    let isNow = marker.entry.type === "NOW";
                    return (
                        <div
                            className="sit-stand-marker"
                            key={i}
                            style={{
                                position: "absolute",
                                left: `${marker.position}%`,
                                transform: "translateX(-50%)",
                                background: "white",
                                borderRadius: "36px",
                                width: "60px",
                                textAlign: "center",
                                height: "60px",
                                border: "4px solid black",
                                zIndex: isLast ? "0" : "1",
                                pointerEvents:
                                    isLast && isNow ? "none" : "auto",
                            }}
                        >
                            <SitStandIcon
                                entry={marker.entry}
                                onClick={() => setEditingEntry(marker.entry)}
                            />
                        </div>
                    );
                })}
                {durationMarkers.map((marker, i) => (
                    <DurationMarker {...marker} key={i} />
                ))}
            </Pane>
            <EditEntryForm
                entry={editingEntry}
                deleteEntry={deleteEntry}
                updateEntry={updateEntry}
                cancel={() => setEditingEntry(null)}
            />
        </Pane>
    );
}

export default App;
