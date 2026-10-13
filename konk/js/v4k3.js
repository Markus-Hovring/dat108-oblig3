"use strict";

/* Momenter:
 * setCustomValidity på felt for startnummer og navn
 * Kontrollelement sin egenskap validitystate
 */

/**
 * Håndterer webside for innlesing av nye deltagere og visning av deltagere.
 */
class KonkurranseController {
    #tabellelement;

    /**
     * @param {HTMLFormElement} formelement
     * @param {HTMLTableElement} tabellelement
     */
    constructor(formelement, filterelement, tabellelement) {
        formelement.addEventListener('submit', event => this.#registrer(event));
        filterelement.addEventListener('submit', event => this.#aktiverFilter(event));
        filterelement.addEventListener('reset', event => this.#tømFilter(event));

        this.#tabellelement = tabellelement;

        const startnummerInput = formelement.elements["startnummer"];
        startnummerInput.addEventListener(
            'input',
            event => this.#validerStartnummer(event.target)
        );

        const navnInput = formelement.elements["navn"];
        navnInput.addEventListener(
            'input',
            event => this.#validerNavn(event.target)
        );

        this.#validerStartnummer(startnummerInput);
        this.#validerNavn(navnInput);
    }

    /**
     * Legger til ny deltager med data last fra form-skjema
     *
     * @param {SubmitEvent} event
     */
    #registrer(event) {
        event.preventDefault();
        const form = event.target;

        const formData = new FormData(form);
        const deltager = {
            'startnummer': Number(formData.get('startnummer')),
            'navn': formData.get('navn').trim()
        };

        this.#visDeltager(deltager);
        form.reset();
        
        this.#validerStartnummer(form.elements["startnummer"]);
        this.#validerNavn(form.elements["navn"]);
    }

    /**
     * Validerer verdi i INPUT felt for startnummer for ny deltager
     *
     * @param {HTMLInputElement} target
     */
    #validerStartnummer(target) {
        target.setCustomValidity("");
        let errormessage = "";

        if (target.validity.valueMissing) {
            errormessage = "Startnummer er påkrevd";
        } else if (target.validity.badInput
                || target.validity.rangeUnderflow
                || target.validity.stepMismatch) {
            errormessage = "Startnummer må være et heltall større eller lik 1";
        } else if (this.#startnummerFinnes(target.valueAsNumber)) {
            errormessage = "Startnummer er i bruk";
        }

        target.setCustomValidity(errormessage);
        target.title = errormessage;
    }

    /**
     * Validerer verdi i INPUT felt for navn for ny deltager
     *
     * @param {HTMLInputElement} target
     */
    #validerNavn(target) {
        target.setCustomValidity("");
        let errormessage = "";

        if (target.validity.valueMissing) {
            errormessage = "Navn mangler";
        } else if (target.validity.patternMismatch) {
            errormessage = "Navn må bestå av ett eller flere delnavn skilt av mellomrom eller bindestrek og hvert delnavn må starte med stor forbokstav etterfulgt av kun små bokstaver";
        }

        target.setCustomValidity(errormessage);
        target.title = errormessage;
    }

        /**
     * Validerer sluttid og regner ut løpstid
     *
     * @param {HTMLTableRowElement} rad
     */
    #oppdaterTid(rad) {
        const startInput = rad.cells[2].firstElementChild;
        const sluttInput = rad.cells[3].firstElementChild;
        const løpstidCelle = rad.cells[4];

        let errormessage = "";
        løpstidCelle.textContent = "";

        if (startInput.value !== "" && sluttInput.value !== "") {
            const start = startInput.valueAsNumber;
            const slutt = sluttInput.valueAsNumber;

            if (slutt <= start) {
                errormessage = "Sluttid må være etter starttid";
            } else {
                løpstidCelle.textContent = this.#formaterTid(slutt - start);
            }
        }

        sluttInput.setCustomValidity(errormessage);
        sluttInput.title = errormessage;
    }

    /**
     * Gjør om millisekunder til tekst
     *
     * @param {number} millisekunder
     * @returns {string}
     */
    #formaterTid(millisekunder) {
        const totalSekunder = Math.floor(millisekunder / 1000);
        const timer = Math.floor(totalSekunder / 3600);
        const minutter = Math.floor((totalSekunder % 3600) / 60);
        const sekunder = totalSekunder % 60;

        return String(timer).padStart(2, "0") + ":"
             + String(minutter).padStart(2, "0") + ":"
             + String(sekunder).padStart(2, "0");
    }

        /**
     * Viser bare deltagerene som stemmer med filteret
     *
     * @param {SubmitEvent} event
     */
    #aktiverFilter(event) {
        event.preventDefault();
        const form = event.target;
        const visning = form.querySelector("span");

        const mønster = form.elements["filtertekst"].value;
        const kolonne = Number(form.elements["felt"].value);   // 0 = startnummer, 1 = navn
        const feltnavn = kolonne === 0 ? "startnummer" : "navn";

        let regex;
        try {
            regex = new RegExp(mønster);
        } catch (feil) {
            visning.textContent = `Ugyldig mønster "${mønster}"`;
            return;
        }

        for (const rad of this.#tabellelement.tBodies[0].rows) {
            const tekst = rad.cells[kolonne].textContent;
            rad.hidden = !regex.test(tekst);
        }

        visning.textContent = `Mønster "${mønster}" på felt "${feltnavn}"`;
    }

    /**
     * Fjerner filteret og vise alle deltagere igjen
     *
     * @param {Event} event
     */
    #tømFilter(event) {
        for (const rad of this.#tabellelement.tBodies[0].rows) {
            rad.hidden = false;
        }
        event.target.querySelector("span").textContent = "Ingen";
    }

    /**
     * Viser deltager i deltagerlisten plassert mhp. startnummer stigende
     *
     * @param {Object} deltager
     */
    #visDeltager(deltager) {
        const tbody = this.#tabellelement.tBodies[0];
        const HTMLTbodyRowsAsArray = Array.from(tbody.rows);
        const dennenummer = deltager.startnummer;
        const indeks = HTMLTbodyRowsAsArray.findIndex(
            rekke => {
                const trnummer = Number(rekke.cells[0].textContent);
                return dennenummer < trnummer;
            }
        );

        const newRow = this.#tabellelement.tBodies[0].insertRow(indeks);
        newRow.dataset.startnummer = deltager.startnummer;
        newRow.insertCell(-1).textContent = deltager.startnummer;
        newRow.insertCell(-1).textContent = deltager.navn;
        newRow.insertCell(-1).innerHTML = "<input type='time' step='1'>";
        newRow.insertCell(-1).innerHTML = "<input type='time' step='1'>";
        newRow.insertCell(-1);
        const startInput = newRow.cells[2].firstElementChild;
        const sluttInput = newRow.cells[3].firstElementChild;
        startInput.addEventListener('input', () => this.#oppdaterTid(newRow));
        sluttInput.addEventListener('input', () => this.#oppdaterTid(newRow));
        this.#tabellelement.classList.remove('hidden');
    }

    /**
     * Sjekker om input-parameter startnummer allerede finnes i deltagerlisten
     *
     * @param {number} startnummer
     * @returns {boolean}
     */
    #startnummerFinnes(startnummer) {
        const tbody = this.#tabellelement.tBodies[0];
        const element = tbody.querySelector(`tr[data-startnummer="${startnummer}"]`);
        return element !== null;
    }
}

const formelement = document.forms["nydeltager"];
const filterelement = document.forms["filter"];
const tabellelement = document.getElementById("deltagere");
new KonkurranseController(formelement, filterelement, tabellelement);
