package com.secureeye.control.service

import android.content.Context
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.RectF
import android.view.View
import com.secureeye.control.safety.SafetyState

/**
 * Custom system overlay canvas rendering the virtual gaze cursor, dwell radial indicator,
 * and safety status indicators above any Android application.
 */
class OverlayCursorView(context: Context) : View(context) {

    var cursorX: Float = 540f
    var cursorY: Float = 1200f
    var dwellProgress: Float = 0f
    var safetyState: SafetyState = SafetyState.TRACKING
    var isEmergencyPaused: Boolean = false

    private val cursorOuterPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = Color.parseColor("#38BDF8") // Sky Cyan
        style = Paint.Style.STROKE
        strokeWidth = 6f
        setShadowLayer(8f, 0f, 0f, Color.parseColor("#80000000"))
    }

    private val cursorInnerPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = Color.parseColor("#0284C7")
        style = Paint.Style.FILL
    }

    private val dwellArcPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = Color.parseColor("#22C55E") // Bright Green
        style = Paint.Style.STROKE
        strokeWidth = 10f
        strokeCap = Paint.Cap.ROUND
    }

    private val statusPillPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = Color.parseColor("#D90F172A") // Semi-transparent dark slate
        style = Paint.Style.FILL
    }

    private val textPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = Color.WHITE
        textSize = 32f
        textAlign = Paint.Align.CENTER
        isFakeBoldText = true
    }

    private val arcBounds = RectF()
    private val cursorRadius = 36f

    fun updateCursor(x: Float, y: Float, progress: Float, state: SafetyState, paused: Boolean) {
        this.cursorX = x
        this.cursorY = y
        this.dwellProgress = progress
        this.safetyState = state
        this.isEmergencyPaused = paused
        invalidate()
    }

    override fun onDraw(canvas: Canvas) {
        super.onDraw(canvas)

        if (isEmergencyPaused) {
            // Draw emergency pause indicator at top
            canvas.drawRect(0f, 0f, width.toFloat(), 120f, statusPillPaint)
            textPaint.color = Color.parseColor("#FBBF24")
            canvas.drawText("EYE CONTROL PAUSED (Blink & Hold to Resume)", width / 2f, 75f, textPaint)
            return
        }

        if (safetyState == SafetyState.TRACKING_LOST) {
            cursorOuterPaint.color = Color.parseColor("#EF4444") // Red
            canvas.drawCircle(cursorX, cursorY, cursorRadius, cursorOuterPaint)
            return
        }

        // Draw outer ring
        cursorOuterPaint.color = when (safetyState) {
            SafetyState.ACTION -> Color.parseColor("#E0E7FF")
            SafetyState.CONFIRMATION -> Color.parseColor("#22C55E")
            SafetyState.GAZE_STABLE -> Color.parseColor("#38BDF8")
            else -> Color.parseColor("#94A3B8")
        }
        canvas.drawCircle(cursorX, cursorY, cursorRadius, cursorOuterPaint)

        // Draw inner dot
        canvas.drawCircle(cursorX, cursorY, 8f, cursorInnerPaint)

        // Draw radial dwell arc
        if (dwellProgress > 0f) {
            arcBounds.set(
                cursorX - cursorRadius,
                cursorY - cursorRadius,
                cursorX + cursorRadius,
                cursorY + cursorRadius
            )
            val sweepAngle = dwellProgress * 360f
            canvas.drawArc(arcBounds, -90f, sweepAngle, false, dwellArcPaint)
        }

        // Action ripple flash
        if (safetyState == SafetyState.ACTION) {
            val ripplePaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
                color = Color.parseColor("#6638BDF8")
                style = Paint.Style.STROKE
                strokeWidth = 14f
            }
            canvas.drawCircle(cursorX, cursorY, cursorRadius * 1.6f, ripplePaint)
        }
    }
}
