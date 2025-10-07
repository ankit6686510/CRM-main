import React from "react";

// Pagination component

const Pagination = ({ itemsPerPage, totalItems, paginate, currentPage }) => {
  const pageNumbers = [];
// Calculate the total number of pages
  for (let i = 1; i <= Math.ceil(totalItems / itemsPerPage); i++) {
    pageNumbers.push(i);
  }
// Render the pagination buttons
  return (
    <nav className="mt-4 flex justify-center">
      <ul className="flex items-center space-x-1">
        {pageNumbers.map((number) => (
          <li key={number}>
            <button
              onClick={() => paginate(number)}
              className={`px-3 py-1 rounded-md ${
                currentPage === number
                  ? "bg-[var(--skin-color)] text-white"
                  : "bg-[var(--bg-black-50)] text-[var(--text-black-900)] hover:bg-[var(--bg-black-900)]"
              }`}
            >
              {number}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default Pagination;
