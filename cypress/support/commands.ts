/// <reference types="cypress" />

import { TestFilterTypeEnum } from "./FilterTypeEnum";

export {};

/**
 * ⚠️ Referanstaki `loginThroughUI` `input[name="tenantId"]` bekliyordu — bu
 * proje login ekranında (src/components/Login/LoginScreen.tsx) böyle bir alan
 * YOK, yalnızca `userName`/`password`. Gerçek `data-cy` attribute'larına göre
 * yeniden yazıldı.
 */
Cypress.Commands.add("loginThroughUI", () => {
  cy.visit("/tr");

  cy.url().then((currentUrl) => {
    if (currentUrl.includes("/dashboard")) {
      cy.log("Zaten giriş yapılmış, login adımı atlanıyor.");
      return;
    }

    cy.get('[data-cy="login-username"] input').type(Cypress.env("testUser"));
    cy.get('[data-cy="login-password"] input').type(Cypress.env("testPassword"));
    cy.get('[data-cy="login-submit"]').click();

    cy.url().should("include", "/dashboard");
  });
});

Cypress.Commands.add("closeToast", () => {
  cy.get('[data-cy="ops-snackbar-close-button"]').click();
});

Cypress.Commands.add("openModal", () => {
  cy.get('[data-cy="ops-new-button"]').click();
  cy.get('[data-cy="ops-modal-content"]').should("be.visible");
});

Cypress.Commands.add("closeModal", () => {
  cy.get('[data-cy="ops-modal-content"]').should("be.visible");
  cy.get('[data-cy="ops-form-cancel-button"]').click();
  cy.get('[data-cy="ops-modal-content"]').should("not.exist");
});

Cypress.Commands.add("saveModal", () => {
  cy.get('[data-cy="ops-form-submit-button"]').click();
});

Cypress.Commands.add("saveModalAndClose", () => {
  cy.get('[data-cy="ops-form-submit-button"]').click();
  cy.get('[data-cy="ops-modal-content"]').should("not.exist");
});

Cypress.Commands.add("confirmDelete", () => {
  cy.get('[data-cy^="ops-table-row-delete-confirm-"]').first().click();
});

Cypress.Commands.add("clickNewButton", () => {
  cy.get('[data-cy="ops-new-button"]').click();
});

Cypress.Commands.add("clickRowByText", (text: string) => {
  cy.get('[data-cy^="ops-table-row-"]').contains(text).parents("tr").click();
  cy.get('[data-cy="ops-modal-content"]').should("be.visible");
});

Cypress.Commands.add("clickRowByTextForPage", (text: string) => {
  cy.get('[data-cy^="ops-table-row-"]').contains(text).parents("tr").click();
});

Cypress.Commands.add("clickRowButtonByText", (text: string, type: string) => {
  cy.get('[data-cy^="ops-table-row-"]')
    .contains(text)
    .parents("tr")
    .find(`[data-cy^="ops-table-row-${type}-"]`)
    .click();
});

Cypress.Commands.add("deleteRowByText", (text: string) => {
  cy.get('[data-cy^="ops-table-row-"]')
    .contains(text)
    .parents("tr")
    .find('[data-cy^="ops-table-row-delete-"]')
    .click();

  cy.confirmDelete();
});

Cypress.Commands.add("addFilter", (column: string, operator: TestFilterTypeEnum, value: string) => {
  cy.get('[data-cy="ops-table-filter"]').click();
  cy.get(`[data-cy="ops-table-filter-select-column-0-${column}"]`).click({ force: true });
  cy.get(`[data-cy="ops-table-filter-select-operator-${operator}"]`).click({ force: true });
  cy.get('[data-cy="ops-table-filter-value-0"]').type(value);
  cy.get('[data-cy="ops-table-filter-apply"]').click();
});

Cypress.Commands.add("resetFilter", () => {
  cy.get('[data-cy="ops-table-filter"]').click();
  cy.get('[data-cy="ops-table-filter-reset"]').click();
});

Cypress.Commands.add("sortColumn", (column: string) => {
  cy.get(`[data-cy="ops-table-header-${column}"]`).click();
});

Cypress.Commands.add("checkPageTitle", (text: string) => {
  cy.get('[data-cy="page-title"]').should("contain.text", text);
});

Cypress.Commands.add("checkPageFormTitle", (text: string) => {
  cy.get('[data-cy="ops-form-title"]').should("contain.text", text);
});

Cypress.Commands.add("clickBackButton", () => {
  cy.get('[data-cy="ops-back-link"]').click();
});

Cypress.Commands.add("fillInput", (field: string, value: string) => {
  cy.get(`[data-cy="input-${field}"]`).scrollIntoView().wait(200).should("be.visible").click({ force: true }).clear().type(value, { force: true });
});

Cypress.Commands.add("forceClearInput", (field: string) => {
  cy.get(`[data-cy="input-${field}"]`).scrollIntoView().should("be.visible").click({ force: true }).clear({ force: true });
});

Cypress.Commands.add("selectOption", (field: string, value: string) => {
  cy.get(`[data-cy="input-${field}"]`).select(value);
});

Cypress.Commands.add("selectAutoComplete", (field: string, value: string) => {
  cy.get(`[data-cy="input-${field}"]`).click().type(value);
  cy.get(".MuiAutocomplete-popper li").contains(value).should("be.visible").click({ force: true });
});

Cypress.Commands.add("toggleSwitch", (field: string) => {
  cy.get(`[data-cy="input-${field}"]`).click();
});

Cypress.Commands.add("checkCheckbox", (field: string) => {
  cy.get(`[data-cy="input-${field}"]`).check();
});

Cypress.Commands.add("clearTable", () => {
  cy.get('[data-cy="ops-table"]').should("be.visible");

  const deleteFirstRow = () => {
    cy.get("body").then(($body) => {
      if ($body.find('[data-cy^="ops-table-row-delete-"]').length > 0) {
        cy.get('[data-cy^="ops-table-row-delete-"]').first().click();
        cy.confirmDelete();
        deleteFirstRow();
      } else {
        cy.log("Tablo zaten boş.");
      }
    });
  };

  deleteFirstRow();
});

Cypress.Commands.add("checkInputError", (field: string, errorText: string) => {
  cy.get(`[data-cy="input-${field}"]`).closest(".MuiFormControl-root").find(".MuiFormHelperText-root").should("contain.text", errorText);
});

Cypress.Commands.add("checkTableCellExist", (text: string) => {
  cy.get('[data-cy^="ops-table-cell-"]').should("contain.text", text);
});

Cypress.Commands.add("checkTableCellNotExist", (text: string) => {
  cy.get("body").then(($body) => {
    const cells = $body.find('[data-cy^="ops-table-cell-"]');
    if (cells.length === 0) {
      cy.log("Tablo boş.");
      return;
    }

    const found = Array.from(cells).some((cell) => cell.textContent?.toLowerCase().includes(text.toLowerCase()));
    if (found) {
      throw new Error(`"${text}" metni tabloda bulunmaması gerekirken bulundu.`);
    }
  });
});

Cypress.Commands.add("formValidationTrigger", (field: string) => {
  cy.fillInput(field, "text");
  cy.forceClearInput(field);
  cy.get('[data-cy="ops-form-submit-button"]').should("not.be.disabled").click();
});

Cypress.Commands.add("checkRowExistWithFilter", (column: string, operator: TestFilterTypeEnum, expectedText: string) => {
  cy.addFilter(column, operator, expectedText);
  cy.checkTableCellExist(expectedText);
  cy.resetFilter();
});

Cypress.Commands.add("checkTableCellExistOnAnyPage", (text: string) => {
  function searchInPage(): void {
    cy.get('[data-cy^="ops-table-cell-"]').then(($cells) => {
      const found = Array.from($cells).some((cell) => cell.textContent?.trim().includes(text));
      if (found) return;

      cy.get('[data-cy="ops-table-pagination-next"]').then(($next) => {
        if ($next.attr("disabled") !== undefined) {
          throw new Error(`"${text}" tablonun hiçbir sayfasında bulunamadı.`);
        }
        cy.wrap($next).click();
        cy.wait(300);
        searchInPage();
      });
    });
  }

  searchInPage();
});

Cypress.Commands.add("checkTableCellNotExistOnAnyPage", (text: string) => {
  function searchInPage(retryCount = 0): void {
    if (retryCount > 20) throw new Error("Sayfalama arama limiti aşıldı.");

    cy.get('[data-cy^="ops-table-cell-"]').then(($cells) => {
      const found = Array.from($cells).some((cell) => cell.textContent?.trim().includes(text));
      if (found) {
        throw new Error(`"${text}" bulunmaması gereken bir sayfada bulundu.`);
      }

      cy.get('[data-cy="ops-table-pagination-next"]').then(($next) => {
        if ($next.attr("disabled") !== undefined) return;
        cy.wrap($next).click({ force: true });
        cy.wait(300);
        searchInPage(retryCount + 1);
      });
    });
  }

  searchInPage();
});

Cypress.Commands.add("goToNextPage", () => {
  cy.get('[data-cy="ops-table-pagination-next"]').should("not.be.disabled").click();
});
Cypress.Commands.add("goToPreviousPage", () => {
  cy.get('[data-cy="ops-table-pagination-prev"]').should("not.be.disabled").click();
});
Cypress.Commands.add("goToFirstPage", () => {
  cy.get('[data-cy="ops-table-pagination-first"]').should("not.be.disabled").click();
});
Cypress.Commands.add("goToLastPage", () => {
  cy.get('[data-cy="ops-table-pagination-last"]').should("not.be.disabled").click();
});
Cypress.Commands.add("goToPage", (pageNumber: number) => {
  cy.get(`[data-cy="ops-table-pagination-page-${pageNumber}"]`).should("exist").click();
});
