const API_URL = "http://localhost:8080";

document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".login-btn").forEach(btn => {
        btn.addEventListener("click", async () => {
            const type = btn.dataset.type;

            try {
                const res = await fetch(`${API_URL}/login?type=${type}`, {
                    credentials: "include"
                });

                const data = await res.json();

                if (data.auth_url) {
                    window.location.href = data.auth_url;
                    return;
                }

                if (data.code) {
                    localStorage.setItem("auth_code", data.code);
                    window.location.href = "code.html";
                }

            } catch (err) {
                console.error("Ошибка подключения:", err);
                alert("Сервер не запущен. Проверь main_module.exe");
            }
        });
    });
});
