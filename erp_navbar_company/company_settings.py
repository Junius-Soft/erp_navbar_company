import frappe
from frappe import _


@frappe.whitelist()
def set_user_default_company(company_name):
    """Set the default company for the current user."""
    if not frappe.has_permission("Company", "read"):
        frappe.throw(_("You do not have permission to set the default company."))

    frappe.defaults.set_user_default("company", company_name)
    frappe.clear_cache(user=frappe.session.user)
