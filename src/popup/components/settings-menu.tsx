import React, { useEffect, useState } from "react";
import { defaultSettings } from "../../shared/defaults";
import { SET_SETTINGS_ACTION, GetSettings, SetSettings, Settings } from "../../shared/types";
import { Button, Switch, FormControlLabel, TextField, Box } from "@material-ui/core";
import update from "immutability-helper";
import _ from "lodash";

export const SettingsMenu = () => {
    const [settings, setSettings] = useState<Settings>(_.cloneDeep(defaultSettings));
    const [changed, setChanged] = useState<boolean>(false);

    useEffect(() => {
        chrome.runtime.sendMessage({ action: "GET_SETTINGS" } as GetSettings, response => {
            try {
                const settings = Settings.check(response);
                setSettings(settings);
            } catch (e) {}
        });
    }, []);

    return (
        <>
            <Box p={2}>
                <form
                    onSubmit={event => {
                        event.preventDefault();
                        chrome.runtime.sendMessage({
                            action: SET_SETTINGS_ACTION,
                            payload: settings
                        } as SetSettings);
                        setChanged(false);
                    }}
                    onChange={() => setChanged(true)}
                >
                    <Box mb={2}>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={settings.on}
                                    onChange={() => {
                                        setSettings(settings =>
                                            update(settings, {
                                                on: { $set: !settings.on }
                                            })
                                        );
                                    }}
                                    color="primary"
                                />
                            }
                            label="Automation On"
                        />
                    </Box>
                    <Box mb={2}>
                        <TextField
                            fullWidth={true}
                            label="Participant Drop"
                            type="number"
                            variant="outlined"
                            size="small"
                            required
                            InputLabelProps={{
                                shrink: true
                            }}
                            InputProps={{
                                inputProps: {
                                    min: "1",
                                    max: "1000"
                                }
                            }}
                            value={settings.drop}
                            onChange={e => {
                                setSettings(settings =>
                                    update(settings, {
                                        drop: {
                                            $set: parseInt(e.target.value) || 0
                                        }
                                    })
                                );
                            }}
                        />
                    </Box>
                    <Box mb={2}>
                        <TextField
                            fullWidth={true}
                            label="Drop Timespan"
                            type="number"
                            variant="outlined"
                            size="small"
                            required
                            InputLabelProps={{
                                shrink: true
                            }}
                            InputProps={{
                                inputProps: {
                                    min: "1",
                                    max: "10"
                                }
                            }}
                            value={settings.timespan}
                            onChange={e => {
                                setSettings(settings =>
                                    update(settings, {
                                        timespan: {
                                            $set: parseInt(e.target.value) || 0
                                        }
                                    })
                                );
                            }}
                        />
                    </Box>
                    <Button
                        size="small"
                        variant="contained"
                        color="primary"
                        type="submit"
                        fullWidth={true}
                        disabled={!changed}
                    >
                        Save
                    </Button>
                </form>
            </Box>
        </>
    );
};
