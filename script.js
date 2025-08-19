/* JS for Student Registration System
   Responsibilities:
   - State management (students array, localStorage)
   - Validation (name, id, email, contact)
   - CRUD (add, edit, delete)
   - Render table + dynamic scrollbar
   - UI helpers (active section highlight, footer year)
*/

(function () {
  "use strict";

  // DOM references
  const form = document.getElementById("studentForm");
  const nameInput = document.getElementById("name");
  const studentIdInput = document.getElementById("studentId");
  const emailInput = document.getElementById("email");
  const contactInput = document.getElementById("contact");

  const nameError = document.getElementById("nameError");
  const studentIdError = document.getElementById("studentIdError");
  const emailError = document.getElementById("emailError");
  const contactError = document.getElementById("contactError");

  const submitBtn = document.getElementById("submitBtn");
  const updateBtn = document.getElementById("updateBtn");
  const cancelEditBtn = document.getElementById("cancelEditBtn");

  const tbody = document.getElementById("recordsTbody");
  const tableWrap = document.getElementById("tableWrap");
  const currentYear = document.getElementById("year");

  // App state
  let students = loadStudents();
  let editIndex = null; // index of the student currently being edited (null if adding)

  // Utility: persist & load
  function saveStudents() {
    localStorage.setItem("students", JSON.stringify(students));
  }
  function loadStudents() {
    try {
      return JSON.parse(localStorage.getItem("students")) || [];
    } catch {
      return [];
    }
  }

  // Validation helpers
  const isLettersOnly = (str) => /^[A-Za-z\s]+$/.test(str.trim());
  const isDigitsOnly = (str) => /^\d+$/.test(str);
  const isValidEmail = (str) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str.trim());
  const minDigits = (str, n) => str.replace(/\D/g, "").length >= n;

  // Show validation error helpers
  function setError(el, msg) {
    el.textContent = msg;
  }
  function clearErrors() {
    [nameError, studentIdError, emailError, contactError].forEach(
      (e) => (e.textContent = "")
    );
  }

  // Live input sanitizers (numbers only where required)
  studentIdInput.addEventListener("input", () => {
    studentIdInput.value = studentIdInput.value.replace(/\D/g, "");
  });
  contactInput.addEventListener("input", () => {
    contactInput.value = contactInput.value.replace(/\D/g, "");
  });
  nameInput.addEventListener("input", () => {
    // Allow only letters and spaces; strip others
    nameInput.value = nameInput.value.replace(/[^A-Za-z\s]/g, "");
  });

  // Form validation per Task 6 spec
  function validateForm(payload) {
    clearErrors();
    const { name, studentId, email, contact } = payload;

    // Empty prevention (no empty rows)
    if (!name || !studentId || !email || !contact) {
      // Specific messages per field
      if (!name) setError(nameError, "Name is required.");
      if (!studentId) setError(studentIdError, "Student ID is required.");
      if (!email) setError(emailError, "Email is required.");
      if (!contact) setError(contactError, "Contact number is required.");
      return false;
    }

    if (!isLettersOnly(name)) {
      setError(nameError, "Only letters and spaces are allowed.");
      return false;
    }
    if (!isDigitsOnly(studentId)) {
      setError(studentIdError, "Student ID must contain digits only.");
      return false;
    }
    if (!isValidEmail(email)) {
      setError(emailError, "Please enter a valid email address.");
      return false;
    }
    if (!isDigitsOnly(contact)) {
      setError(contactError, "Contact number must contain digits only.");
      return false;
    }
    if (!minDigits(contact, 10)) {
      setError(contactError, "Contact number must have at least 10 digits.");
      return false;
    }

    const duplicateIndex = students.findIndex(
      (s, idx) => s.studentId === studentId && idx !== editIndex
    );
    if (duplicateIndex !== -1) {
      setError(studentIdError, "This Student ID already exists.");
      return false;
    }

    return true;
  }

  // Render table rows and update vertical scrollbar dynamically
  function render() {
    tbody.innerHTML = "";

    students.forEach((s, index) => {
      const tr = document.createElement("tr");

      const makeCell = (label, value) => {
        const td = document.createElement("td");
        td.textContent = value;
        td.setAttribute("data-label", label); // used by mobile responsive layout
        return td;
      };

      tr.appendChild(makeCell("Student Name", s.name));
      tr.appendChild(makeCell("Student ID", s.studentId));
      tr.appendChild(makeCell("Email", s.email));
      tr.appendChild(makeCell("Contact No.", s.contact));

      const tdActions = document.createElement("td");
      tdActions.setAttribute("data-label", "Actions");
      tdActions.className = "action-btns";

      const editBtn = document.createElement("button");
      editBtn.type = "button";
      editBtn.className = "edit";
      editBtn.textContent = "Edit";
      editBtn.addEventListener("click", () => startEdit(index));

      const delBtn = document.createElement("button");
      delBtn.type = "button";
      delBtn.className = "delete";
      delBtn.textContent = "Delete";
      delBtn.addEventListener("click", () => deleteStudent(index));

      tdActions.appendChild(editBtn);
      tdActions.appendChild(delBtn);

      tr.appendChild(tdActions);

      tbody.appendChild(tr);
    });

    // If many records, enable contained scroll. Otherwise, let it grow.
    const rows = tbody.querySelectorAll("tr").length;
    if (rows > 6) {
      tableWrap.classList.add("scrollable");
    } else {
      tableWrap.classList.remove("scrollable");
    }
  }

  // Start edit: populate form and switch buttons
  function startEdit(index) {
    const s = students[index];
    editIndex = index;
    nameInput.value = s.name;
    studentIdInput.value = s.studentId;
    emailInput.value = s.email;
    contactInput.value = s.contact;

    submitBtn.hidden = true;
    updateBtn.hidden = false;
    cancelEditBtn.hidden = false;

    clearErrors();
    nameInput.focus({ preventScroll: true });
  }

  function resetEditState() {
    editIndex = null;
    submitBtn.hidden = false;
    updateBtn.hidden = true;
    cancelEditBtn.hidden = true;
    form.reset();
    clearErrors();
  }

  // CRUD operations
  function addStudent(payload) {
    students.push(payload);
    saveStudents();
    render();
  }

  function updateStudent(payload) {
    if (editIndex === null) return;
    students[editIndex] = payload;
    saveStudents();
    render();
    resetEditState();
  }

  function deleteStudent(index) {
    if (!confirm("Delete this record?")) return;
    students.splice(index, 1);
    saveStudents();
    render();
  }

  // Handle Add (default) submit
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const payload = {
      name: nameInput.value.trim(),
      studentId: studentIdInput.value.trim(),
      email: emailInput.value.trim(),
      contact: contactInput.value.trim(),
    };
    if (!validateForm(payload)) return;
    addStudent(payload);
    form.reset();
    clearErrors();
    nameInput.focus({ preventScroll: true });
  });

  // Handle Update (when editing)
  updateBtn.addEventListener("click", () => {
    const payload = {
      name: nameInput.value.trim(),
      studentId: studentIdInput.value.trim(),
      email: emailInput.value.trim(),
      contact: contactInput.value.trim(),
    };
    if (!validateForm(payload)) return;
    updateStudent(payload);
  });

  // Cancel edit
  cancelEditBtn.addEventListener("click", resetEditState);

  // Footer year
  currentYear.textContent = new Date().getFullYear();

  // Initial render
  render();

  const sections = {
    register: document.getElementById("register"),
    records: document.getElementById("records"),
  };
  const navLinks = {
    register: document.querySelector('a[href="#register"]'),
    records: document.querySelector('a[href="#records"]'),
  };

  function setActive(sectionId) {
    // Remove all highlights
    Object.values(sections).forEach((sec) =>
      sec.classList.remove("active-section")
    );
    Object.values(navLinks).forEach((link) => link.classList.remove("active"));

    // Highlight selected section & nav link
    sections[sectionId].classList.add("active-section");
    navLinks[sectionId].classList.add("active");
  }

  // Highlight on nav click
  Object.entries(navLinks).forEach(([id, link]) => {
    link.addEventListener("click", () => {
      setActive(id);
    });
  });

  // Highlight on scroll
  window.addEventListener("scroll", () => {
    const scrollPos = window.scrollY + 150; // offset for nav height
    Object.entries(sections).forEach(([id, section]) => {
      if (
        scrollPos >= section.offsetTop &&
        scrollPos < section.offsetTop + section.offsetHeight
      ) {
        setActive(id);
      }
    });
  });

  // Default highlight on load
  setActive("register");
})();
