/// <reference types="cypress" />

import type { TestFilterTypeEnum } from "./FilterTypeEnum";

export {};

declare global {
  namespace Cypress {
    interface Chainable {
      loginThroughUI(): Chainable<void>;
      closeToast(): Chainable<void>;
      openModal(): Chainable<void>;
      closeModal(): Chainable<void>;
      saveModal(): Chainable<void>;
      saveModalAndClose(): Chainable<void>;
      confirmDelete(): Chainable<void>;
      clickNewButton(): Chainable<void>;
      clickRowByText(text: string): Chainable<void>;
      clickRowByTextForPage(text: string): Chainable<void>;
      clickRowButtonByText(text: string, type: string): Chainable<void>;
      addFilter(column: string, operator: TestFilterTypeEnum, value: string): Chainable<void>;
      resetFilter(): Chainable<void>;
      sortColumn(column: string): Chainable<void>;
      checkPageTitle(text: string): Chainable<void>;
      checkPageFormTitle(text: string): Chainable<void>;
      clickBackButton(): Chainable<void>;
      fillInput(field: string, value: string): Chainable<void>;
      selectOption(field: string, value: string): Chainable<void>;
      selectAutoComplete(field: string, value: string): Chainable<void>;
      toggleSwitch(field: string): Chainable<void>;
      checkCheckbox(field: string): Chainable<void>;
      clearTable(): Chainable<void>;
      checkInputError(field: string, errorText: string): Chainable<void>;
      deleteRowByText(text: string): Chainable<void>;
      forceClearInput(field: string): Chainable<void>;
      checkTableCellExist(text: string): Chainable<void>;
      checkTableCellNotExist(text: string): Chainable<void>;
      formValidationTrigger(field: string): Chainable<void>;
      checkRowExistWithFilter(column: string, operator: TestFilterTypeEnum, expectedText: string): Chainable<void>;
      checkTableCellExistOnAnyPage(text: string): Chainable<void>;
      checkTableCellNotExistOnAnyPage(text: string): Chainable<void>;
      goToNextPage(): Chainable<void>;
      goToPreviousPage(): Chainable<void>;
      goToFirstPage(): Chainable<void>;
      goToLastPage(): Chainable<void>;
      goToPage(pageNumber: number): Chainable<void>;
    }
  }
}
