package com.notes.service;

import com.notes.model.AbstractNote;
import org.springframework.stereotype.Service;

/**
 * Service to polymorphically export notes into different formats (Markdown, HTML, Plain Text).
 */
@Service
public class ExportService {

    public String exportToMarkdown(AbstractNote note) {
        StringBuilder sb = new StringBuilder();
        sb.append("# ").append(note.getTitle()).append("\n\n");
        sb.append("> **Type**: ").append(note.getType());
        sb.append(" | **Created**: ").append(note.getCreatedAt());
        sb.append(" | **Updated**: ").append(note.getUpdatedAt()).append("\n\n");

        if (!note.getTags().isEmpty()) {
            sb.append("**Tags**: `").append(String.join("`, `", note.getTags())).append("`\n\n");
        }

        sb.append("---\n\n");
        sb.append(note.render());
        sb.append("\n");
        return sb.toString();
    }

    public String exportToPlainText(AbstractNote note) {
        StringBuilder sb = new StringBuilder();
        sb.append("TITLE: ").append(note.getTitle()).append("\n");
        sb.append("TYPE: ").append(note.getType()).append("\n");
        sb.append("CREATED: ").append(note.getCreatedAt()).append("\n");
        sb.append("UPDATED: ").append(note.getUpdatedAt()).append("\n");
        if (!note.getTags().isEmpty()) {
            sb.append("TAGS: ").append(String.join(", ", note.getTags())).append("\n");
        }
        sb.append("--------------------------------------------------\n");
        sb.append(note.render()).append("\n");
        return sb.toString();
    }

    public String exportToHtml(AbstractNote note) {
        StringBuilder sb = new StringBuilder();
        sb.append("<!DOCTYPE html>\n<html>\n<head>\n");
        sb.append("<meta charset='utf-8'><title>").append(escapeHtml(note.getTitle())).append("</title>\n");
        sb.append("<style>\n");
        sb.append("body { font-family: system-ui, sans-serif; max-width: 80ch; margin: 2rem auto; line-height: 1.6; color: #1e293b; }\n");
        sb.append("h1 { color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 0.5rem; }\n");
        sb.append(".meta { color: #64748b; font-size: 0.9rem; margin-bottom: 1.5rem; }\n");
        sb.append(".tag { background: #f1f5f9; padding: 2px 8px; border-radius: 4px; font-size: 0.8rem; margin-right: 4px; }\n");
        sb.append(".content { white-space: pre-wrap; background: #f8fafc; padding: 1.5rem; border-radius: 8px; border: 1px solid #e2e8f0; }\n");
        sb.append("</style>\n</head>\n<body>\n");

        sb.append("<h1>").append(escapeHtml(note.getTitle())).append("</h1>\n");
        sb.append("<div class='meta'>");
        sb.append("Type: <strong>").append(note.getType()).append("</strong> | ");
        sb.append("Created: ").append(note.getCreatedAt()).append("<br>\n");
        if (!note.getTags().isEmpty()) {
            sb.append("Tags: ");
            for (String tag : note.getTags()) {
                sb.append("<span class='tag'>#").append(escapeHtml(tag)).append("</span>");
            }
            sb.append("<br>\n");
        }
        sb.append("</div>\n");

        sb.append("<div class='content'>\n").append(escapeHtml(note.render())).append("\n</div>\n");
        sb.append("</body>\n</html>");
        return sb.toString();
    }

    private String escapeHtml(String text) {
        if (text == null) return "";
        return text.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }
}
