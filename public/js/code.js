const API_URL = "http://localhost:8080";

document.addEventListener('DOMContentLoaded', () => {
    const codeInput = document.getElementById('authCode');
    const statusEl = document.getElementById('status');
    const submitBtn = document.getElementById('submitCode');

    submitBtn.addEventListener('click', async () => {
        const code = codeInput.value.trim();

        if (code.length !== 6) {
            statusEl.textContent = "Введите 6 цифр";
            return;
        }

        statusEl.textContent = "Проверка...";

        try {
            const res = await fetch(`${API_URL}/auth/code`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ code })
            });

            const text = await res.text();

            if (res.ok && text.trim() === "ok") {
                statusEl.textContent = "Успешный вход!";
                setTimeout(() => window.location.href = "dashboard.html", 500);
            } else {
                statusEl.textContent = "Неверный код";
            }

        } catch (e) {
            statusEl.textContent = "Ошибка сервера";
        }
    });
});
