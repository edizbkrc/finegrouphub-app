/// <reference types="cypress" />

/**
 * ⚠️ Referanstaki layout testi eski bir ürünün rotalarını
 * ("/dashboard/products", "#DeskManagement-menu") ve `localStorage`
 * anahtarını ("MilvaToken" — bu projede hiç kullanılmıyor, bkz.
 * @enums/LocalStorageKeysEnum) test ediyordu. FineGroupHub'da menü
 * TAMAMEN API'den (`GET /v1/UI/menuItems`) üretiliyor (kodlama kuralı #4);
 * bu yüzden menü gezinme testleri Laravel API hazır olup gerçek menü verisi
 * dönene kadar YAZILAMAZ — sabit href'lerle test etmek "sabit menü tanımı
 * yok" ilkesini ihlal eder.
 *
 * Bu dosya, API'siz doğrulanabilen tek şeyi kapsar: middleware'in korumalı
 * sayfayı login'e yönlendirmesi. Menü/logout testleri Faz 11+ modülleriyle
 * birlikte, gerçek `cy.loginThroughUI()` çalışır hâle gelince eklenmelidir.
 */
describe("Layout — oturum koruması", () => {
  it("oturumsuz kullanıcıyı korumalı sayfadan login'e yönlendirir", () => {
    cy.visit("/tr/dashboard");
    cy.url().should("eq", `${Cypress.config("baseUrl")}/tr?returnUrl=%2Ftr%2Fdashboard`);
  });

  it("login ekranı oturumsuz erişilebilir", () => {
    cy.visit("/tr");
    cy.location("pathname").should("eq", "/tr");
  });
});
