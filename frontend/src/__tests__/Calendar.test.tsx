import { render, screen, fireEvent } from "@testing-library/react";
import Calendar from "@/components/Calendar";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const noop = () => {};

describe("Calendar", () => {
  const today = new Date();

  test("renders current month and year by default", () => {
    render(<Calendar selectedDate={null} onSelectDate={noop} datesWithEntries={new Set()} />);
    expect(
      screen.getByText(`${MONTH_NAMES[today.getMonth()]} ${today.getFullYear()}`)
    ).toBeInTheDocument();
  });

  test("renders all day-of-week headers", () => {
    render(<Calendar selectedDate={null} onSelectDate={noop} datesWithEntries={new Set()} />);
    ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].forEach((d) => {
      expect(screen.getByText(d)).toBeInTheDocument();
    });
  });

  test("navigates to previous month", () => {
    render(<Calendar selectedDate={null} onSelectDate={noop} datesWithEntries={new Set()} />);
    fireEvent.click(screen.getByLabelText("Previous month"));
    const prev = new Date(today.getFullYear(), today.getMonth() - 1);
    expect(
      screen.getByText(`${MONTH_NAMES[prev.getMonth()]} ${prev.getFullYear()}`)
    ).toBeInTheDocument();
  });

  test("navigates to next month", () => {
    render(<Calendar selectedDate={null} onSelectDate={noop} datesWithEntries={new Set()} />);
    fireEvent.click(screen.getByLabelText("Next month"));
    const next = new Date(today.getFullYear(), today.getMonth() + 1);
    expect(
      screen.getByText(`${MONTH_NAMES[next.getMonth()]} ${next.getFullYear()}`)
    ).toBeInTheDocument();
  });

  test("calls onSelectDate with the correct date string when a day is clicked", () => {
    const onSelect = jest.fn();
    render(<Calendar selectedDate={null} onSelectDate={onSelect} datesWithEntries={new Set()} />);
    // Click day "1" of the current month
    fireEvent.click(screen.getAllByText("1")[0]);
    const expected = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-01`;
    expect(onSelect).toHaveBeenCalledWith(expected);
  });

  test("highlights the selected date", () => {
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    const { container } = render(
      <Calendar selectedDate={todayStr} onSelectDate={noop} datesWithEntries={new Set()} />
    );
    // The selected button should have the amber-500 class
    const selectedBtn = container.querySelector("button.bg-amber-500");
    expect(selectedBtn).not.toBeNull();
    expect(selectedBtn?.textContent).toBe(String(today.getDate()));
  });
});
