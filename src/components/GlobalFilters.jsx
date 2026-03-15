import React from "react";

function GlobalFilters({ filters, setFilters, applyFilters }) {

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFilters({
      ...filters,
      [name]: value
    });
  };

  return (
    <div className="filter-bar">

      <select name="branch" value={filters.branch} onChange={handleChange}>
        <option value="">All Branches</option>
        <option value="Ahmedabad">Ahmedabad</option>
        <option value="Bangalore">Bangalore</option>
        <option value="Chennai">Chennai</option>
      </select>

      <select name="department" value={filters.department} onChange={handleChange}>
        <option value="">All Departments</option>
        <option value="HR">HR</option>
        <option value="Engineering">Engineering</option>
        <option value="Sales">Sales</option>
      </select>

      <select name="year" value={filters.year} onChange={handleChange}>
        <option value="">All Years</option>
        <option value="2023">2023</option>
        <option value="2024">2024</option>
        <option value="2025">2025</option>
      </select>

      <button onClick={applyFilters}>Apply Filters</button>

    </div>
  );
}

export default GlobalFilters;