CLASS zcl_sales_odata_dpc_ext DEFINITION
  PUBLIC
  INHERITING FROM /iwbep/cl_mgw_abs_data
  CREATE PUBLIC.

  PUBLIC SECTION.
    METHODS /iwbep/if_mgw_appl_srv_runtime~get_entityset REDEFINITION.
    METHODS /iwbep/if_mgw_appl_srv_runtime~get_entity REDEFINITION.
    METHODS /iwbep/if_mgw_appl_srv_runtime~create_entity REDEFINITION.
    METHODS /iwbep/if_mgw_appl_srv_runtime~update_entity REDEFINITION.
    METHODS /iwbep/if_mgw_appl_srv_runtime~delete_entity REDEFINITION.

  PROTECTED SECTION.
    METHODS salesorders_get_entityset
      IMPORTING
        !iv_entity_name           TYPE string
        !iv_entity_set_name       TYPE string
        !iv_source_name           TYPE string
        !it_filter_select_options TYPE /iwbep/t_mgw_select_option
        !it_order                 TYPE /iwbep/t_mgw_sorting_order
        !is_paging                TYPE /iwbep/s_mgw_paging
      EXPORTING
        !et_entityset             TYPE STANDARD TABLE
        !es_response_context      TYPE /iwbep/if_mgw_appl_srv_runtime=>ty_s_mgw_response_context
      RAISING
        /iwbep/cx_mgw_busi_exception
        /iwbep/cx_mgw_tech_exception.

    METHODS salesorders_get_entity
      IMPORTING
        !iv_entity_name     TYPE string
        !iv_entity_set_name TYPE string
        !it_key_tab         TYPE /iwbep/t_mgw_name_value_pair
      EXPORTING
        !er_entity          TYPE any
      RAISING
        /iwbep/cx_mgw_busi_exception
        /iwbep/cx_mgw_tech_exception.
ENDCLASS.

CLASS zcl_sales_odata_dpc_ext IMPLEMENTATION.

  METHOD /iwbep/if_mgw_appl_srv_runtime~get_entityset.
    CASE io_tech_request_context->get_entity_set_name( ).
      WHEN 'SalesOrderSet'.
        DATA lt_salesorders TYPE TABLE OF z_i_salesorder_tp.
        salesorders_get_entityset(
          EXPORTING
            iv_entity_name           = iv_entity_name
            iv_entity_set_name       = iv_entity_set_name
            iv_source_name           = iv_source_name
            it_filter_select_options = it_filter_select_options
            it_order                 = it_order
            is_paging                = is_paging
          IMPORTING
            et_entityset             = lt_salesorders
            es_response_context      = es_response_context ).
        copy_data_to_ref( EXPORTING is_data = lt_salesorders CHANGING cr_data = er_entityset ).
      WHEN OTHERS.
        super->/iwbep/if_mgw_appl_srv_runtime~get_entityset(
          EXPORTING
            iv_entity_name           = iv_entity_name
            iv_entity_set_name       = iv_entity_set_name
            iv_source_name           = iv_source_name
            it_filter_select_options = it_filter_select_options
            it_order                 = it_order
            is_paging                = is_paging
            it_navigation_path       = it_navigation_path
            io_tech_request_context  = io_tech_request_context
          IMPORTING
            er_entityset             = er_entityset
            es_response_context      = es_response_context ).
    ENDCASE.
  ENDMETHOD.

  METHOD salesorders_get_entityset.
    DATA: lt_orders TYPE TABLE OF z_i_salesorder_tp,
          lv_top    TYPE i,
          lv_skip   TYPE i.

    lv_top  = COND #( WHEN is_paging-top > 0 THEN is_paging-top ELSE 50 ).
    lv_skip = is_paging-skip.

    SELECT SalesOrderID, CustomerID, CustomerName, GrossAmount, CurrencyCode, OverallStatus, CreatedAt
      FROM Z_I_SalesOrder_TP
      ORDER BY SalesOrderID DESCENDING
      INTO CORRESPONDING FIELDS OF TABLE @lt_orders
      UP TO @lv_top ROWS OFFSET @lv_skip.

    et_entityset = lt_orders.
    es_response_context-count = lines( lt_orders ).
  ENDMETHOD.

  METHOD /iwbep/if_mgw_appl_srv_runtime~get_entity.
    CASE io_tech_request_context->get_entity_set_name( ).
      WHEN 'SalesOrderSet'.
        DATA ls_order TYPE z_i_salesorder_tp.
        salesorders_get_entity(
          EXPORTING
            iv_entity_name     = iv_entity_name
            iv_entity_set_name = iv_entity_set_name
            it_key_tab         = it_key_tab
          IMPORTING
            er_entity          = ls_order ).
        copy_data_to_ref( EXPORTING is_data = ls_order CHANGING cr_data = er_entity ).
      WHEN OTHERS.
        super->/iwbep/if_mgw_appl_srv_runtime~get_entity(
          EXPORTING
            iv_entity_name          = iv_entity_name
            iv_entity_set_name      = iv_entity_set_name
            it_key_tab              = it_key_tab
            it_navigation_path      = it_navigation_path
            io_tech_request_context = io_tech_request_context
          IMPORTING
            er_entity               = er_entity ).
    ENDCASE.
  ENDMETHOD.

  METHOD salesorders_get_entity.
    DATA lv_vbeln TYPE vbeln_va.
    READ TABLE it_key_tab WITH KEY name = 'SalesOrderID' INTO DATA(ls_key).
    IF sy-subrc = 0.
      lv_vbeln = |{ ls_key-value ALPHA = IN }|.
    ENDIF.

    SELECT SINGLE SalesOrderID, CustomerID, CustomerName, GrossAmount, CurrencyCode, OverallStatus, CreatedAt
      FROM Z_I_SalesOrder_TP
      WHERE SalesOrderID = @lv_vbeln
      INTO CORRESPONDING FIELDS OF @er_entity.

    IF sy-subrc <> 0.
      RAISE EXCEPTION TYPE /iwbep/cx_mgw_busi_exception
        EXPORTING
          textid = /iwbep/cx_mgw_busi_exception=>resource_not_found.
    ENDIF.
  ENDMETHOD.

  METHOD /iwbep/if_mgw_appl_srv_runtime~create_entity.
  ENDMETHOD.

  METHOD /iwbep/if_mgw_appl_srv_runtime~update_entity.
  ENDMETHOD.

  METHOD /iwbep/if_mgw_appl_srv_runtime~delete_entity.
  ENDMETHOD.

ENDCLASS.
