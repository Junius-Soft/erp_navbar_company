frappe.after_ajax(() => {
  displayCompanyInNavbar();
});

function displayCompanyInNavbar() {
  const navbar = document.querySelector(".navbar-collapse");
  const searchBar = document.querySelector("form");

  if (navbar) {
    const default_company = frappe.defaults.get_default("company");

    const dropdownDiv = document.createElement("div");
    dropdownDiv.classList.add("dropdown", "navbar-company");

    const dropdownButton = document.createElement("button");
    dropdownButton.classList.add("btn", "btn-link", "dropdown-toggle");
    dropdownButton.type = "button";
    dropdownButton.id = "companyDropdown";
    dropdownButton.dataset.toggle = "dropdown";
    dropdownButton.setAttribute("aria-haspopup", "true");
    dropdownButton.setAttribute("aria-expanded", "false");
    dropdownButton.textContent = default_company || "Select Company";

    const dropdownMenu = document.createElement("div");
    dropdownMenu.classList.add("dropdown-menu");
    dropdownMenu.setAttribute("aria-labelledby", "companyDropdown");

    frappe.call({
      method: "frappe.client.get_list",
      args: {
        doctype: "Company",
        fields: ["name"],
      },
      callback: function (response) {
        if (response && response.message) {
          response.message.forEach((company) => {
            const companyItem = document.createElement("a");
            companyItem.classList.add("dropdown-item");
            companyItem.href = "#";
            companyItem.textContent = company.name;
            companyItem.onclick = function () {
              setDefaultCompany(company.name);
            };
            dropdownMenu.appendChild(companyItem);
          });
        }
      },
    });

    dropdownDiv.appendChild(dropdownButton);
    dropdownDiv.appendChild(dropdownMenu);
    searchBar.prepend(dropdownDiv);
  } else {
    // Retry after a short delay if .navbar-collapse is not found
    setTimeout(displayCompanyInNavbar, 100); // Adjust delay as needed
  }
}

function setDefaultCompany(companyName) {
  frappe.call({
    method: "erp_navbar_company.company_settings.set_user_default_company",
    args: {
      company_name: companyName,
    },
    callback: function () {
      frappe.show_alert({
        message: `Default Company changed to ${companyName}`,
        indicator: "green",
      });

      document.getElementById("companyDropdown").textContent = companyName;

      frappe.ui.toolbar.clear_cache();
    },
  });
}
