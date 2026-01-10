console.log("Web Client loaded");

// обработка кликов по кнопкам входа
document.addEventListener("DOMContentLoaded", () => {
    const loginButtons = document.querySelectorAll(".login-btn");

    loginButtons.forEach(button => {
        button.addEventListener("click", (event) => {
            const type = event.target.dataset.type;
            console.log("Выбран способ входа:", type);

            // запрос к backend Web Client
        });
    });
});

// запросы к серверу
async function apiRequest(url, options = {}) {
    try {
        const response = await fetch(url, options);

        if (response.status === 401) {
            console.log("Пользователь не авторизован");
            window.location.href = "/";
            return;
        }

        if (response.status === 403) {
            alert("Нет прав для выполнения действия");
            return;
        }

        return await response.json();
    } catch (error) {
        console.error("Ошибка запроса:", error);
    }
}
