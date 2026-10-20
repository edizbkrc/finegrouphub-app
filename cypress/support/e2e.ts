import "./commands";
import "./commands.type";

// Uygulama içinde yakalanmamış bir hata olsa da test paketinin devam etmesini sağlar.
Cypress.on("uncaught:exception", () => false);
