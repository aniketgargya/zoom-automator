import { defaultSettings, defaultZoomClasses } from "../shared/defaults";
import {
    GET_SETTINGS_ACTION,
    GetSettings,
    GetZoomClasses,
    RECEIVE_SETTINGS_ACTION,
    SETTINGS_PORT_NAME,
    SetSettings,
    Settings,
    SetZoomClasses,
    ZoomClasses
} from "../shared/types";
import _ from "lodash";

let settings: Settings = _.cloneDeep(defaultSettings);
let settingsPorts: chrome.runtime.Port[] = [];
let zoomClasses: ZoomClasses = _.cloneDeep(defaultZoomClasses);

const setSettings = (newSettings: Settings) => {
    settings = _.cloneDeep(newSettings);

    chrome.storage.local.set({ settings: newSettings });

    settingsPorts.forEach(settingsPort => {
        settingsPort.postMessage({
            action: RECEIVE_SETTINGS_ACTION,
            payload: settings
        });
    });
};

const setZoomClasses = (newZoomClasses: ZoomClasses) => {
    zoomClasses = _.cloneDeep(newZoomClasses);

    chrome.storage.local.set({ zoomClasses: newZoomClasses });
};

chrome.storage.local.get(["settings", "zoomClasses"], response => {
    try {
        const settings = Settings.check(response.settings);
        const zoomClasses = ZoomClasses.check(response.zoomClasses);
        setSettings(settings);
        setZoomClasses(zoomClasses);
    } catch (e) {}
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (GetSettings.guard(request)) sendResponse(settings);
    else if (SetSettings.guard(request)) setSettings(request.payload);
    else if (GetZoomClasses.guard(request)) sendResponse(zoomClasses);
    else if (SetZoomClasses.guard(request)) setZoomClasses(request.payload);
});

chrome.runtime.onConnect.addListener(port => {
    switch (port.name) {
        case SETTINGS_PORT_NAME:
            port.onDisconnect.addListener(() => {
                settingsPorts = settingsPorts.filter(settingsPort => settingsPort != port);
            });

            port.onMessage.addListener(request => {
                switch (request.action) {
                    case GET_SETTINGS_ACTION:
                        port.postMessage({
                            action: RECEIVE_SETTINGS_ACTION,
                            payload: settings
                        });
                        break;
                }
            });

            settingsPorts.push(port);
            break;
    }
});
