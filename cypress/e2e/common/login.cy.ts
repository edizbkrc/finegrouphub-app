/// <reference types="cypress" />

/**
 * ⚠️ Referanstaki login testi `input[name="tenantId"]` bekliyor ve sabit
 * "opsiyonRoot" kimlik bilgileriyle giriş deniyordu — bu proje login
 * ekranında (LoginScreen.tsx) tenantId alanı YOK ve testler gerçek API
 * olmadan "başarılı giriş" senaryosunu doğrulayamaz. Yalnızca API'siz test
 * edilebilen davranışlar (form varlığı, doğrulama, şifre göster/gizle)
 * burada kalır; başarılı giriş senaryosu Laravel API hazır olunca eklenir.
 */
describe("Giriş Sayfası", () => {
  beforeEach(() => {
    cy.visit("/tr");
  });

  it("giriş formu doğru alanlarla yükleniyor", () => {
    cy.contains("button", "Giriş Yap").should("be.visible");
    cy.get('[data-cy="login-username"] input').should("exist");
    cy.get('[data-cy="login-password"] input').should("exist");
  });

  it("boş formda submit doğrulama hatası gösterir", () => {
    cy.get('[data-cy="login-submit"]').click();
    // TextField'ın kök div'i `Mui-error` sınıfını taşımaz; sınıf içteki
    // label/input'a (FormLabel, OutlinedInput) verilir.
    cy.get('[data-cy="login-username"] .Mui-error').should("exist");
    cy.get('[data-cy="login-password"] .Mui-error').should("exist");
  });

  it("şifre göster/gizle butonu çalışır", () => {
    cy.get('[data-cy="login-password"] input').as("passwordInput").should("have.attr", "type", "password");

    cy.get('[data-cy="login-password"] button').click();
    cy.get("@passwordInput").should("have.attr", "type", "text");

    cy.get('[data-cy="login-password"] button').click();
    cy.get("@passwordInput").should("have.attr", "type", "password");
  });
});
