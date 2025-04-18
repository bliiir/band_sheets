import React, { useState, useEffect } from "react";
import "./BandSheetEditor.css";
import { ReactComponent as GripIcon } from "../assets/grip.svg";
import { ReactComponent as TrashIcon } from "../assets/trash.svg";
import { ReactComponent as CopyPlusIcon } from "../assets/copy_plus.svg";
import { ReactComponent as ListPlusIcon } from "../assets/list_plus.svg";

/**
 * BandSheetEditor – full compile‑ready file
 * Sections each have their own header bar with: ⇅ title energy + ×
 * Part rows list: Part | Bars | Lyrics | ⇅ + ×
 * Drag‑and‑drop: reorder sections and rows within a section
 */

const DropIndicator = () => (
  <div style={{ height: 0, borderTop: "3px solid #3498db", margin: 0 }} />
);

export default function BandSheetEditor() {
  // State
  const [songData, setSongData] = useState({ title: "", artist: "", bpm: "" });
  const [sections, setSections] = useState([]);
  const [editing, setEditing] = useState(null); // {si,pi,field}
  const [editValue, setEditValue] = useState("");
  const [dragInfo, setDragInfo] = useState(null); // { type:'section'|'part', si, pi }
  const [indicator, setIndicator] = useState(null); // {type,index,si}
  const [idCounter, setIdCounter] = useState(() => Date.now());

  // Only add the initial section on mount
  useEffect(() => {
    if (sections.length === 0) {
      setSections([
        {
          id: idCounter,
          name: "Verse 1",
          energy: 5,
          parts: [{ id: idCounter + 1, part: "A", bars: 4, lyrics: "" }],
        },
      ]);
      setIdCounter((id) => id + 2);
    }
    // eslint-disable-next-line
  }, []);

  // Helper to get a unique ID
  const getNextId = () => {
    setIdCounter((id) => id + 1);
    return idCounter + 1;
  };

  // Immutably update sections
  const updateSections = (cb) =>
    setSections((prev) =>
      cb(prev.map((s) => ({
        ...s,
        parts: s.parts.map((p) => ({ ...p })),
      })))
    );

  // Editing logic
  const beginEdit = (si, pi, f) => {
    setEditing({ si, pi, f });
    setEditValue(String(sections[si].parts[pi][f] ?? ""));
  };

  const saveEdit = () => {
    if (!editing) return;
    const { si, pi, f } = editing;
    updateSections((prev) => {
      const next = prev.map((section, sidx) => {
        if (sidx !== si) return section;
        return {
          ...section,
          parts: section.parts.map((part, pidx) => {
            if (pidx !== pi) return part;
            return {
              ...part,
              [f]: f === "bars" ? parseInt(editValue || "0", 10) : editValue,
            };
          }),
        };
      });
      return next;
    });
    setEditing(null);
  };

  const isEditing = (si, pi, f) =>
    editing && editing.si === si && editing.pi === pi && editing.f === f;

  // Drag helpers
  const gap = (e, idx) =>
    e.clientY - e.currentTarget.getBoundingClientRect().top >
      e.currentTarget.getBoundingClientRect().height / 2
      ? idx + 1
      : idx;

  const clearDrag = () => {
    setDragInfo(null);
    setIndicator(null);
  };

  // CRUD
  const addSection = () => {
    const newId = getNextId();
    const partId = getNextId();
    setSections((prev) => [
      ...prev,
      {
        id: newId,
        name: "New Section",
        energy: 5,
        parts: [{ id: partId, part: "A", bars: 4, lyrics: "" }],
      },
    ]);
  };

  const deleteSection = (si) => {
    setSections((prev) => prev.filter((_, idx) => idx !== si));
  };

  const addPart = (si) => {
    const newId = getNextId();
    setSections((prev) =>
      prev.map((section, idx) => {
        if (idx !== si) return section;
        const p = section.parts;
        const next = String.fromCharCode(
          (p[p.length - 1]?.part.charCodeAt(0) ?? 64) + 1,
        );
        return {
          ...section,
          parts: [
            ...section.parts,
            { id: newId, part: next, bars: 4, lyrics: "" },
          ],
        };
      }),
    );
  };

  const deletePart = (si, pi) => {
    setSections((prev) =>
      prev.map((section, idx) => {
        if (idx !== si) return section;
        return {
          ...section,
          parts: section.parts.filter((_, pidx) => pidx !== pi),
        };
      }),
    );
  };

  // Drag handlers
  const startSectionDrag = (e, si) => {
    e.dataTransfer.effectAllowed = "move";
    setDragInfo({ type: "section", si });
  };

  const overSection = (e, hoverSi) => {
    if (dragInfo?.type !== "section") return;
    e.preventDefault();
    const g = gap(e, hoverSi);
    setIndicator({ type: "section", index: g });
  };

  const dropSection = () => {
    if (dragInfo?.type !== "section" || !indicator) return;
    setSections((prev) => {
      const arr = prev.slice();
      const [moved] = arr.splice(dragInfo.si, 1);
      let tgt = indicator.index;
      if (dragInfo.si < tgt) tgt -= 1;
      arr.splice(tgt, 0, moved);
      return arr;
    });
    clearDrag();
  };

  const startPartDrag = (e, si, pi) => {
    e.stopPropagation();
    e.dataTransfer.effectAllowed = "move";
    setDragInfo({ type: "part", si, pi });
  };

  const overPart = (e, si, hoverPi) => {
    if (dragInfo?.type !== "part" || dragInfo.si !== si) return;
    e.preventDefault();
    const g = gap(e, hoverPi);
    setIndicator({ type: "part", si, index: g });
  };

  const dropPart = (si) => {
    if (dragInfo?.type !== "part" || !indicator || dragInfo.si !== si) return;
    setSections((prev) =>
      prev.map((section, idx) => {
        if (idx !== si) return section;
        const arr = section.parts.slice();
        const [moved] = arr.splice(dragInfo.pi, 1);
        let tgt = indicator.index;
        if (dragInfo.pi < tgt) tgt -= 1;
        arr.splice(tgt, 0, moved);
        return { ...section, parts: arr };
      }),
    );
    clearDrag();
  };

  // Cell renderer
  const cell = (si, pi, f, v, cls) => {
    const ed = isEditing(si, pi, f);
    return (
      <div className={cls} onClick={() => !ed && beginEdit(si, pi, f)}>
        {ed ? (
          f === "lyrics" ? (
            <textarea
              className="lyrics-textarea"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={saveEdit}
              onKeyDown={(e) => {
                if (e.key === "Escape") setEditing(null);
                // Allow Enter key for new lines in lyrics
              }}
              autoFocus
            />
          ) : (
            <input
              className="cell-input"
              style={{
                width: f === "bars" ? "4ch" : "3ch",
                textAlign: "center",
              }}
              type={f === "bars" ? "number" : "text"}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={saveEdit}
              onKeyDown={(e) => {
                if (e.key === "Enter") saveEdit();
                if (e.key === "Escape") setEditing(null);
              }}
              autoFocus
            />
          )
        ) : (
          <div className={f === "lyrics" ? "lyrics-display" : ""} style={{ width: "100%" }}>
            {v}
          </div>
        )}
      </div>
    );
  };

  // Export handler for clarity
  const handleExport = () => {
    console.log({ ...songData, sections });
  };

  // JSX
  return (
    <div className="band-sheet-editor" onDragEnd={clearDrag}>
      {/* top bar */}
      <div className="song-info-bar">
        <input
          className="title-input"
          placeholder="Song Title"
          value={songData.title}
          onChange={(e) =>
            setSongData((prev) => ({ ...prev, title: e.target.value }))
          }
        />
        <input
          className="artist-input"
          placeholder="Artist"
          value={songData.artist}
          onChange={(e) =>
            setSongData((prev) => ({ ...prev, artist: e.target.value }))
          }
        />
        <div className="bpm-container">
          <input
            className="bpm-input"
            type="number"
            placeholder="BPM"
            value={songData.bpm}
            onChange={(e) =>
              setSongData((prev) => ({ ...prev, bpm: e.target.value }))
            }
          />
          <span>bpm</span>
        </div>
        <div className="button-container">
          <button className="export-button" onClick={handleExport}>
            Export
          </button>
        </div>
      </div>

      {/* sheet */}
      <div className="band-sheet-container">
        {/* Column Headers */}
        <div className="band-sheet-header">
          <div className="part-col">Part</div>
          <div className="bars-col">Bars</div>
          <div className="lyrics-col">Lyrics</div>
          <div className="actions-col">Actions</div>
        </div>

        {sections.map((s, si) => (
          <React.Fragment key={s.id}>
            {indicator?.type === "section" && indicator.index === si && (
              <DropIndicator />
            )}
            {/* section header using grid layout */}
            <div
              className="section-header-row grid-row"
              style={{
                backgroundColor: `rgb(${Math.round(
                  236 - (s.energy - 1) * 20,
                )}, ${Math.round(236 - (s.energy - 1) * 20)}, ${Math.round(
                  236 - (s.energy - 1) * 20,
                )})`,
                color: s.energy > 5 ? "white" : "black",
              }}
              onDragOver={(e) => overSection(e, si)}
              onDrop={dropSection}
              draggable
              onDragStart={(e) => startSectionDrag(e, si)}
            >
              {/* Part column: Section name */}
              <div className="part-col section-name-cell">
                <input
                  className="section-name-input"
                  value={s.name}
                  onChange={(e) =>
                    setSections((prev) =>
                      prev.map((section, idx) =>
                        idx === si
                          ? { ...section, name: e.target.value }
                          : section,
                      ),
                    )
                  }
                  style={{
                    color: s.energy > 5 ? "white" : "black",
                    backgroundColor: "transparent",
                  }}
                />
              </div>
              {/* Bars column: (empty for section header) */}
              <div className="bars-col"></div>
              {/* Lyrics column: Energy slider */}
              <div className="lyrics-col energy-slider-header">
                <div className="energy-slider-container">
                  <input
                    type="range"
                    min="1"
                    max="10"
                    className="energy-slider"
                    value={s.energy}
                    onChange={(e) =>
                      setSections((prev) =>
                        prev.map((section, idx) =>
                          idx === si
                            ? {
                                ...section,
                                energy: parseInt(e.target.value, 10),
                              }
                            : section,
                        ),
                      )
                    }
                  />
                  <span
                    className="energy-value"
                    style={{ color: s.energy > 5 ? "white" : "black" }}
                  >
                    {s.energy}
                  </span>
                </div>
              </div>
              {/* Actions column: Section actions */}
              <div
                className="actions-cell actions-col section-actions"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  justifyContent: "flex-end",
                }}
              >
                <button
                  className="duplicate-section-button"
                  style={{
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    marginRight: 0,
                    color: s.energy > 5 ? "white" : "#3498db",
                  }}
                  title="Duplicate section"
                  onClick={() => {
                    const newId = getNextId();
                    setSections((prev) => {
                      const sectionToCopy = {
                        ...prev[si],
                        id: newId,
                        parts: prev[si].parts.map((p) => ({
                          ...p,
                          id: getNextId(),
                        })),
                      };
                      const arr = prev.slice();
                      arr.splice(si + 1, 0, sectionToCopy);
                      return arr;
                    });
                  }}
                >
                  <CopyPlusIcon
                    style={{
                      width: 20,
                      height: 20,
                      verticalAlign: "middle",
                      color: "#333",
                    }}
                  />
                </button>
                <button
                  className="delete-button"
                  onClick={() => deleteSection(si)}
                  style={{
                    color: s.energy > 5 ? "white" : "#e74c3c",
                    marginRight: 0,
                  }}
                  title="Delete section"
                >
                  <TrashIcon
                    style={{
                      width: 20,
                      height: 20,
                      verticalAlign: "middle",
                      color: "#333",
                    }}
                  />
                </button>
                <span
                  className="drag-icon"
                  title="Drag section"
                  style={{
                    color: s.energy > 5 ? "white" : "#777",
                    cursor: "grab",
                  }}
                >
                  <GripIcon
                    style={{
                      width: 20,
                      height: 20,
                      verticalAlign: "middle",
                      color: "#333",
                    }}
                  />
                </span>
              </div>
            </div>

            {/* part rows */}
            {s.parts.map((p, pi) => (
              <React.Fragment key={p.id}>
                {indicator?.type === "part" &&
                  indicator.si === si &&
                  indicator.index === pi && <DropIndicator />}
                <div
                  className={`part-row ${pi % 2 ? "odd-row" : "even-row"}`}
                  draggable
                  onDragStart={(e) => startPartDrag(e, si, pi)}
                  onDragOver={(e) => overPart(e, si, pi)}
                  onDrop={() => dropPart(si)}
                >
                  {cell(si, pi, "part", p.part, "part-cell")}
                  {cell(si, pi, "bars", p.bars, "bars-cell")}
                  {cell(si, pi, "lyrics", p.lyrics, "lyrics-cell")}
                  <div
                    className="actions-cell"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <button
                      className="add-part-button"
                      onClick={() => addPart(si)}
                      title="Add part"
                    >
                      <ListPlusIcon
                        style={{
                          width: 18,
                          height: 18,
                          verticalAlign: "middle",
                          color: "#333",
                        }}
                      />
                    </button>
                    <button
                      className="delete-button"
                      onClick={() => deletePart(si, pi)}
                      title="Delete part"
                    >
                      <TrashIcon
                        style={{
                          width: 18,
                          height: 18,
                          verticalAlign: "middle",
                          color: "#333",
                        }}
                      />
                    </button>
                    <span
                      className="drag-icon"
                      title="Drag row"
                      style={{ cursor: "grab" }}
                    >
                      <GripIcon
                        style={{
                          width: 18,
                          height: 18,
                          verticalAlign: "middle",
                          color: "#333",
                        }}
                      />
                    </span>
                  </div>
                </div>
              </React.Fragment>
            ))}
            {indicator?.type === "part" &&
              indicator.si === si &&
              indicator.index === s.parts.length && <DropIndicator />}
          </React.Fragment>
        ))}
        {indicator?.type === "section" &&
          indicator.index === sections.length && <DropIndicator />}

        {/* Add new section button at the bottom */}
        <div className="add-section-container" onClick={addSection}>
          <div className="add-section-plus">+</div>
          <div className="add-section-text">Add Section</div>
        </div>
      </div>
    </div>
  );
}
