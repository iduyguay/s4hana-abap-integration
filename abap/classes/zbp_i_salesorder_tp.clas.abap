CLASS zbp_i_salesorder_tp DEFINITION
  PUBLIC
  ABSTRACT
  FINAL
  FOR BEHAVIOR OF z_i_salesorder_tp.
ENDCLASS.

CLASS zbp_i_salesorder_tp IMPLEMENTATION.
ENDCLASS.

CLASS lhc_salesorder DEFINITION INHERITING FROM cl_abap_behavior_handler.
  PRIVATE SECTION.
    METHODS get_instance_authorizations FOR INSTANCE AUTHORIZATION
      IMPORTING keys REQUEST requested_authorizations FOR SalesOrder RESULT result.

    METHODS get_instance_features FOR INSTANCE FEATURES
      IMPORTING keys REQUEST requested_features FOR SalesOrder RESULT result.

    METHODS setOrderCompleted FOR MODIFY
      IMPORTING keys FOR ACTION SalesOrder~setOrderCompleted RESULT result.

    METHODS validateCustomer FOR VALIDATE ON SAVE
      IMPORTING keys FOR SalesOrder~validateCustomer.

    METHODS calculateTotalAmount FOR DETERMINE ON MODIFY
      IMPORTING keys FOR SalesOrder~calculateTotalAmount.
ENDCLASS.

CLASS lhc_salesorder IMPLEMENTATION.

  METHOD get_instance_authorizations.
  ENDMETHOD.

  METHOD get_instance_features.
    READ ENTITIES OF z_i_salesorder_tp IN LOCAL MODE
      ENTITY SalesOrder
        FIELDS ( OverallStatus )
        WITH CORRESPONDING #( keys )
      RESULT DATA(lt_orders).

    result = VALUE #( FOR ls_order IN lt_orders
                      ( %tky = ls_order-%tky
                        %action-setOrderCompleted = COND #( WHEN ls_order-OverallStatus = 'Completed'
                                                           THEN if_abap_behv=>fc-o-disabled
                                                           ELSE if_abap_behv=>fc-o-enabled ) ) ).
  ENDMETHOD.

  METHOD setOrderCompleted.
    MODIFY ENTITIES OF z_i_salesorder_tp IN LOCAL MODE
      ENTITY SalesOrder
        UPDATE FIELDS ( OverallStatus )
        WITH VALUE #( FOR key IN keys ( %tky = key-%tky OverallStatus = 'Completed' ) )
      FAILED failed
      REPORTED reported.

    READ ENTITIES OF z_i_salesorder_tp IN LOCAL MODE
      ENTITY SalesOrder
        ALL FIELDS WITH CORRESPONDING #( keys )
      RESULT DATA(lt_updated_orders).

    result = VALUE #( FOR ls_order IN lt_updated_orders
                      ( %tky   = ls_order-%tky
                        %param = ls_order ) ).
  ENDMETHOD.

  METHOD validateCustomer.
    READ ENTITIES OF z_i_salesorder_tp IN LOCAL MODE
      ENTITY SalesOrder
        FIELDS ( CustomerID )
        WITH CORRESPONDING #( keys )
      RESULT DATA(lt_orders).

    LOOP AT lt_orders INTO DATA(ls_order).
      IF ls_order-CustomerID IS INITIAL.
        APPEND VALUE #( %tky = ls_order-%tky ) TO failed-salesorder.
        APPEND VALUE #( %tky = ls_order-%tky
                        %msg = new_message_with_text(
                                 severity = if_abap_behv_message=>severity-error
                                 text     = 'Customer ID cannot be empty.' ) ) TO reported-salesorder.
      ELSE.
        SELECT SINGLE kunnr FROM kna1 WHERE kunnr = @ls_order-CustomerID INTO @DATA(lv_kunnr).
        IF sy-subrc <> 0.
          APPEND VALUE #( %tky = ls_order-%tky ) TO failed-salesorder.
          APPEND VALUE #( %tky = ls_order-%tky
                          %msg = new_message_with_text(
                                   severity = if_abap_behv_message=>severity-error
                                   text     = |Customer { ls_order-CustomerID } does not exist.| ) ) TO reported-salesorder.
        ENDIF.
      ENDIF.
    ENDLOOP.
  ENDMETHOD.

  METHOD calculateTotalAmount.
    READ ENTITIES OF z_i_salesorder_tp IN LOCAL MODE
      ENTITY SalesOrder BY \_Items
        FIELDS ( NetAmount )
        WITH CORRESPONDING #( keys )
      RESULT DATA(lt_items).

    DATA(lv_total) = VALUE netwr( ).
    LOOP AT lt_items INTO DATA(ls_item).
      lv_total += ls_item-NetAmount.
    ENDLOOP.

    MODIFY ENTITIES OF z_i_salesorder_tp IN LOCAL MODE
      ENTITY SalesOrder
        UPDATE FIELDS ( GrossAmount )
        WITH VALUE #( FOR key IN keys ( %tky = key-%tky GrossAmount = lv_total ) )
      FAILED failed
      REPORTED reported.
  ENDMETHOD.

ENDCLASS.
