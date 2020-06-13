import React, {useEffect, useState} from 'react';
import {Button, Dialog, SelectField, TextInputField} from 'evergreen-ui';

export default function EditEntryForm({
    entry,
    deleteEntry,
    updateEntry,
    cancel,
}) {
    const [hour, setHour] = useState(null);
    const [minute, setMinute] = useState(null);
    const [type, setType] = useState(null);

    useEffect(
        () => {
            let d = new Date(entry && entry.date);
            setHour(d.getHours());
            setMinute(d.getMinutes());
            setType(entry && entry.type);
        },
        [entry],
    );

    function handleSubmit() {
        console.log('Time was ', new Date(entry.date));
        let newDate = new Date(entry.date);
        newDate.setHours(hour);
        newDate.setMinutes(minute);
        console.log('Time will be updated to', newDate);
        if (type !== entry.type) {
            console.log('Type will be updated to', type);
        }

        updateEntry({id: entry.id, date: newDate, type});
    }

    function handleDelete(e) {
        e.preventDefault();
        deleteEntry({id: entry.id});
    }

    return (
        <Dialog
            isShown={type ? true : false}
            title="Edit Entry"
            onCloseComplete={cancel}
            onConfirm={handleSubmit}
            confirmLabel="Update">
            <SelectField
                label="Type"
                value={type}
                onChange={e => setType(e.target.value)}>
                <option value="SIT">Sit</option>
                <option value="STAND">Stand</option>
                <option value="DONE">Done</option>
            </SelectField>
            <TextInputField
                label="Hour"
                value={hour}
                onChange={e => setHour(e.target.value)}
            />
            <TextInputField
                label="Minute"
                value={minute}
                onChange={e => setMinute(e.target.value)}
            />
            <Button appearance="minimal" onClick={handleDelete} intent="danger">
                Delete
            </Button>
        </Dialog>
    );
}
