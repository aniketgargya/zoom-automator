import { defaultSettings } from "../shared/defaults";
import {
    GET_SETTINGS_ACTION,
    RECEIVE_SETTINGS_ACTION,
    SETTINGS_PORT_NAME,
    Settings
} from "../shared/types";
import "regenerator-runtime/runtime.js";
import _ from "lodash";

const main = async () => {
    const sleep = (timeout: number): Promise<void> => {
        return new Promise(resolve => setTimeout(resolve, timeout));
    };

    let participantsCount: number = -1;

    if (window.location.href.includes("zoom.us")) {
        let settings: Settings = _.cloneDeep(defaultSettings);
        const intervals: number[] = [];

        const port = chrome.runtime.connect({ name: SETTINGS_PORT_NAME });

        port.onMessage.addListener(request => {
            switch (request.action) {
                case RECEIVE_SETTINGS_ACTION:
                    try {
                        settings = Settings.check(request.payload);
                        break;
                    } catch (e) {}
            }
        });

        port.postMessage({ action: GET_SETTINGS_ACTION });

        let leaveButton: null | HTMLElement = null;
        while (!leaveButton) {
            await sleep(1000);
            leaveButton = document.querySelector<HTMLElement>(".footer__leave-btn");
        }

        let participantsCountDisplay: null | HTMLElement = null;
        while (!participantsCountDisplay) {
            await sleep(1000);
            participantsCountDisplay = document.querySelector<HTMLElement>(
                ".footer-button__participants-icon .footer-button__number-counter span"
            );
        }

        while (participantsCount == -1) {
            await sleep(1000);
            const participantsCountDisplayInnerHTML = parseInt(participantsCountDisplay.innerHTML);
            participantsCount = isNaN(participantsCountDisplayInnerHTML)
                ? participantsCount
                : participantsCountDisplayInnerHTML;
        }

        leaveButton.style.backgroundColor = "rgb(29, 110, 251)";
        participantsCountDisplay.style.color = "rgb(29, 110, 251)";

        const leaveZoom = () => {
            for (let i = 0; i < intervals.length; i++) window.clearInterval(intervals[i]);
            window.setInterval(async () => {
                leaveButton?.click();
                await sleep(100);
                document.querySelector<HTMLElement>(".leave-meeting-options__btn")?.click();
            }, 500);
        };

        participantsCountDisplay.addEventListener("DOMSubtreeModified", () => {
            const startParticipantsCount = participantsCount;
            const startTime = Date.now();
            const intervalId: number = window.setInterval(() => {
                if (Date.now() - startTime > settings.timespan * 1000) {
                    window.clearInterval(intervalId);
                } else if (
                    startParticipantsCount - participantsCount >= settings.drop &&
                    settings.on
                ) {
                    leaveZoom();
                }
            }, 1000);
            intervals.push(intervalId);

            const participantsCountDisplayInnerHTML = parseInt(
                participantsCountDisplay?.innerHTML || "NaN"
            );
            participantsCount = isNaN(participantsCountDisplayInnerHTML)
                ? participantsCount
                : participantsCountDisplayInnerHTML;
        });
    }
};

main();
