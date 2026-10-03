'use strict';

(() => {
    const UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const LOWER = 'abcdefghijklmnopqrstuvwxyz';
    const NUMBERS = '0123456789';
    const SYMBOLS = '-_/*+.,!#$%&()~|';

    const MIN_LENGTH = 8;
    const MAX_LENGTH = 256;
    const OUTPUT_COUNT = 10;

    const lengthInputs = document.querySelectorAll('input[name="length"]');
    const customLengthInput = document.getElementById('customLength');
    const generateButton = document.getElementById('generateButton');
    const resultDiv = document.getElementById('result');
    const status = document.getElementById('status');

    function setStatus(message, isError = false) {
        status.textContent = message;
        status.classList.toggle('error', isError);
    }

    function secureRandomIndex(maxExclusive) {
        if (!Number.isInteger(maxExclusive) || maxExclusive < 1 || maxExclusive > 256) {
            throw new RangeError('Invalid random range.');
        }

        const limit = 256 - (256 % maxExclusive);
        const byte = new Uint8Array(1);

        do {
            crypto.getRandomValues(byte);
        } while (byte[0] >= limit);

        return byte[0] % maxExclusive;
    }

    function secureShuffle(chars) {
        for (let i = chars.length - 1; i > 0; i -= 1) {
            const j = secureRandomIndex(i + 1);
            [chars[i], chars[j]] = [chars[j], chars[i]];
        }
        return chars;
    }

    function selectedLength() {
        const selected = document.querySelector('input[name="length"]:checked');
        if (!selected) {
            throw new Error('文字数を選択してください。');
        }

        const raw = selected.value === 'custom' ? customLengthInput.value : selected.value;
        const length = Number(raw);

        if (!Number.isInteger(length) || length < MIN_LENGTH || length > MAX_LENGTH) {
            throw new Error(`文字数は ${MIN_LENGTH}〜${MAX_LENGTH} の整数で指定してください。`);
        }

        return length;
    }

    function selectedCharacterType() {
        const selected = document.querySelector('input[name="charType"]:checked');
        if (!selected) {
            throw new Error('文字種を選択してください。');
        }
        return selected.value;
    }

    function characterSetsFor(type) {
        switch (type) {
            case 'alphabet':
                return [UPPER, LOWER];
            case 'alphanumeric':
                return [UPPER, LOWER, NUMBERS];
            case 'alphanumeric-symbols':
                return [UPPER, LOWER, NUMBERS, SYMBOLS];
            default:
                throw new Error('不正な文字種が選択されました。');
        }
    }

    function generatePassword(length, type) {
        const requiredSets = characterSetsFor(type);
        const allCharacters = requiredSets.join('');
        const chars = requiredSets.map((set) => set[secureRandomIndex(set.length)]);

        while (chars.length < length) {
            chars.push(allCharacters[secureRandomIndex(allCharacters.length)]);
        }

        return secureShuffle(chars).join('');
    }

    async function copyToClipboard(text, button) {
        try {
            await navigator.clipboard.writeText(text);
            setStatus('クリップボードにコピーしました。');
            const originalText = button.textContent;
            button.textContent = 'コピー済み';
            window.setTimeout(() => {
                button.textContent = originalText;
            }, 1200);
        } catch {
            setStatus('クリップボードへのコピーに失敗しました。', true);
        }
    }

    function generateStrings() {
        try {
            if (!window.isSecureContext || !globalThis.crypto?.getRandomValues) {
                throw new Error('安全な乱数生成を利用できないため、生成を中止しました。HTTPSで開いてください。');
            }

            const length = selectedLength();
            const type = selectedCharacterType();
            const fragment = document.createDocumentFragment();

            for (let i = 0; i < OUTPUT_COUNT; i += 1) {
                const password = generatePassword(length, type);
                const row = document.createElement('div');
                const value = document.createElement('span');
                const copyButton = document.createElement('button');

                row.className = 'result-row';
                value.textContent = password;
                copyButton.type = 'button';
                copyButton.className = 'copy-btn';
                copyButton.textContent = 'コピー';
                copyButton.addEventListener('click', () => copyToClipboard(password, copyButton));

                row.append(value, copyButton);
                fragment.appendChild(row);
            }

            resultDiv.replaceChildren(fragment);
            setStatus('10件生成しました。');
        } catch (error) {
            resultDiv.replaceChildren();
            setStatus(error instanceof Error ? error.message : '生成に失敗しました。', true);
        }
    }

    lengthInputs.forEach((radio) => {
        radio.addEventListener('change', () => {
            customLengthInput.hidden = radio.value !== 'custom' || !radio.checked;
            if (!customLengthInput.hidden) {
                customLengthInput.focus();
            }
        });
    });

    generateButton.addEventListener('click', generateStrings);
})();
