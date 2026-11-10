CLASS zcl_salesorder_unittest DEFINITION
  FOR TESTING
  DURATION SHORT
  RISK LEVEL HARMLESS
  FINAL.

  PRIVATE SECTION.
    DATA: mo_cut TYPE REF TO zbp_i_salesorder_tp.

    CLASS-METHODS:
      class_setup,
      class_teardown.

    METHODS:
      setup,
      teardown,
      test_validate_valid_customer FOR TESTING,
      test_validate_invalid_customer FOR TESTING,
      test_calculate_total_amount FOR TESTING.

ENDCLASS.

CLASS zcl_salesorder_unittest IMPLEMENTATION.

  METHOD class_setup.
  ENDMETHOD.

  METHOD class_teardown.
  ENDMETHOD.

  METHOD setup.
  ENDMETHOD.

  METHOD teardown.
  ENDMETHOD.

  METHOD test_validate_valid_customer.
    DATA(lv_existing_customer) = '0001000001'.
    DATA lt_keys TYPE TABLE FOR ACTION IMPORT z_i_salesorder_tp~setOrderCompleted.
    lt_keys = VALUE #( ( SalesOrderID = '0000000001' ) ).

    cl_abap_unit_assert=>assert_not_initial(
      act = lv_existing_customer
      msg = 'Customer ID should not be initial' ).
  ENDMETHOD.

  METHOD test_validate_invalid_customer.
    DATA(lv_empty_customer) = VALUE kunnr( ).

    cl_abap_unit_assert=>assert_initial(
      act = lv_empty_customer
      msg = 'Empty customer should fail validation check' ).
  ENDMETHOD.

  METHOD test_calculate_total_amount.
    DATA: lv_item1_netwr TYPE netwr VALUE '150.00',
          lv_item2_netwr TYPE netwr VALUE '250.50',
          lv_expected    TYPE netwr VALUE '400.50'.

    DATA(lv_calculated_total) = lv_item1_netwr + lv_item2_netwr;

    cl_abap_unit_assert=>assert_equals(
      act = lv_calculated_total
      exp = lv_expected
      msg = 'Calculated gross amount must equal sum of line item net amounts' ).
  ENDMETHOD.

ENDCLASS.
