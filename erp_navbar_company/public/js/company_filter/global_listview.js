$(document).ready(function () {
  window.company_field_cache = {};

  function has_company_field(doctype) {
    return new Promise((resolve) => {
      if (window.company_field_cache[doctype] !== undefined) {
        resolve(window.company_field_cache[doctype]);
        return;
      }

      frappe.model.with_doctype(doctype, () => {
        const meta = frappe.get_meta(doctype);
        const has_company = meta.fields.some(
          (field) => field.fieldname === "company",
        );
        window.company_field_cache[doctype] = has_company;
        resolve(has_company);
      });
    });
  }

  function clear_all_company_filters(listview) {
    // Clear standard field filters
    if (listview.page.fields_dict && listview.page.fields_dict.company) {
      listview.page.fields_dict.company.set_value("");
    }

    // Clear filter area (dropdown filters)
    const filters = listview.filter_area.filter_list.get_filters();
    listview.filter_area.clear();

    // Re-add non-company filters
    filters.forEach((filter) => {
      if (filter[1] !== "company") {
        listview.filter_area.add([filter]);
      }
    });
  }

  function handle_company_filter(listview) {
    const default_company = frappe.defaults.get_default("company");
    if (!default_company) return;

    // Check both standard field filters and filter area
    let company_filter_exists = false;
    let company_filter_matches = false;

    if (listview.page.fields_dict && listview.page.fields_dict.company) {
      const field_value = listview.page.fields_dict.company.get_value();
      company_filter_exists = !!field_value;
      company_filter_matches = field_value === default_company;
    }

    const filters = listview.filter_area.filter_list.get_filters();
    const dropdown_company_filter = filters.find((f) => f[1] === "company");
    if (dropdown_company_filter) {
      company_filter_exists = true;
      company_filter_matches = dropdown_company_filter[3] === default_company;
    }

    if (
      (company_filter_exists && !company_filter_matches) ||
      !company_filter_exists
    ) {
      clear_all_company_filters(listview);

      listview.filter_area.add([
        [listview.doctype, "company", "=", default_company],
      ]);

      if (listview.page.fields_dict && listview.page.fields_dict.company) {
        listview.page.fields_dict.company.set_value(default_company);
      }

      listview.refresh();
    }
  }

  frappe.router.on("change", async () => {
    const route = frappe.get_route();
    if (route[0] !== "List") return;

    const doctype = route[1];
    if (!doctype) return;

    const has_company = await has_company_field(doctype);
    if (!has_company) return;

    frappe.listview_settings[doctype] = frappe.listview_settings[doctype] || {};
    const existing_onload = frappe.listview_settings[doctype].onload;
    const existing_refresh = frappe.listview_settings[doctype].refresh;

    frappe.listview_settings[doctype].onload = function (listview) {
      if (existing_onload) existing_onload(listview);
      handle_company_filter(listview);
    };

    frappe.listview_settings[doctype].refresh = function (listview) {
      if (existing_refresh) existing_refresh(listview);
      handle_company_filter(listview);
    };

    const current_view = frappe.views.list_view;
    if (current_view && current_view.doctype === doctype) {
      handle_company_filter(current_view);
    }
  });

  // Optional: Listen for changes in default company
  $(document).on("company-changed", function () {
    const route = frappe.get_route();
    if (route[0] === "List" && frappe.views.list_view) {
      handle_company_filter(frappe.views.list_view);
    }
  });
});
