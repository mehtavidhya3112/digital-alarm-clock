"""
Digital Alarm Clock & World Clock (Streamlit Version)
-----------------------------------------------------
A web-based digital alarm clock and world clock built with Python and Streamlit.
"""

import json
import os
import time
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo
import streamlit as st

SAVE_FILE = "alarms.json"
SNOOZE_MINUTES = 5

st.set_page_config(page_title="Digital Alarm Clock & World Time", page_icon="⏰", layout="centered")

# ------------------------------------------------------------ save / load alarms
def load_alarms():
    """Read alarms from alarms.json. Return an empty list if none exist."""
    if not os.path.exists(SAVE_FILE):
        return []
    try:
        with open(SAVE_FILE, "r", encoding="utf-8") as file:
            return json.load(file)
    except (json.JSONDecodeError, OSError):
        return []

def save_alarms(alarms):
    """Write alarms to alarms.json (snooze alarms are temporary, so skip them)."""
    permanent = [a for a in alarms if not a.get("snooze")]
    try:
        with open(SAVE_FILE, "w", encoding="utf-8") as file:
            json.dump(permanent, file, indent=2)
    except OSError:
        st.error("Could not save alarms to disk.")

# Initialize session state for alarms
if "alarms" not in st.session_state:
    st.session_state.alarms = load_alarms()

# --------------------------------------------------------------- UI Layout & Tabs
st.title("⏰ Digital Alarm Clock & World Time")

tab_clock, tab_world = st.tabs(["⏰ Alarm Clock", "🌍 World Time"])

with tab_clock:
    # 24-hour toggle
    use_24h = st.checkbox("Use 24-hour clock", value=False)

    # Live Clock Face Display
    now = datetime.now()
    pattern = "%H:%M:%S" if use_24h else "%I:%M:%S %p"
    time_str = now.strftime(pattern)
    date_str = now.strftime("%A, %d %B %Y")

    st.markdown(f"""
    <style>
    .clock-box {{
        background-color: #2F3E34;
        color: #C9DDBF;
        padding: 24px;
        border-radius: 12px;
        text-align: center;
        font-family: 'Consolas', monospace;
        margin-bottom: 20px;
    }}
    </style>
    <div class="clock-box">
        <h1 style="font-size: 52px; margin: 0; color: #C9DDBF;">{time_str}</h1>
        <p style="font-size: 16px; margin: 8px 0 0 0; color: #C9DDBF;">{date_str}</p>
    </div>
    """, unsafe_allow_html=True)

    # ---------------------------------------------------- Check Ringing Alarms
    current_hhmm = now.strftime("%H:%M")
    ringing_alarm = None
    for alarm in st.session_state.alarms:
        if alarm.get("active") and alarm.get("time") == current_hhmm:
            ringing_alarm = alarm
            break

    if ringing_alarm:
        st.error(f"🚨 **ALARM RINGING!** — {ringing_alarm.get('label', 'Alarm')} ({ringing_alarm.get('time')})")
        st.markdown('<audio autoplay src="https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3"></audio>', unsafe_allow_html=True)
        
        col_stop, col_snooze = st.columns(2)
        with col_stop:
            if st.button("Stop Alarm"):
                if ringing_alarm.get("snooze") and ringing_alarm in st.session_state.alarms:
                    st.session_state.alarms.remove(ringing_alarm)
                else:
                    ringing_alarm["active"] = False
                save_alarms(st.session_state.alarms)
                st.rerun()
        with col_snooze:
            if st.button("Snooze (5 min)"):
                if ringing_alarm in st.session_state.alarms:
                    st.session_state.alarms.remove(ringing_alarm)
                later = datetime.now() + timedelta(minutes=SNOOZE_MINUTES)
                st.session_state.alarms.append({
                    "time": later.strftime("%H:%M"),
                    "label": "Snooze",
                    "active": True,
                    "snooze": True,
                })
                st.session_state.alarms.sort(key=lambda a: a["time"])
                save_alarms(st.session_state.alarms)
                st.rerun()

    st.markdown("---")

    # ---------------------------------------------------- Add Alarm Form
    st.subheader("➕ Add New Alarm")
    with st.form("alarm_form"):
        col1, col2, col3 = st.columns(3)
        with col1:
            hour = st.selectbox("Hour", list(range(1, 13)), format_func=lambda x: f"{x:02d}")
        with col2:
            minute = st.selectbox("Minute", list(range(0, 60)), format_func=lambda x: f"{x:02d}")
        with col3:
            ampm = st.selectbox("AM/PM", ["AM", "PM"])
        
        label = st.text_input("Label", value="Alarm")
        submitted = st.form_submit_button("Add Alarm")
        
        if submitted:
            h24 = hour
            if ampm == "PM" and hour != 12:
                h24 += 12
            if ampm == "AM" and hour == 12:
                h24 = 0
            
            new_alarm = {
                "time": f"{h24:02d}:{minute:02d}",
                "label": label.strip() or "Alarm",
                "active": True,
            }
            st.session_state.alarms.append(new_alarm)
            st.session_state.alarms.sort(key=lambda a: a["time"])
            save_alarms(st.session_state.alarms)
            st.success("Alarm added successfully!")
            st.rerun()

    # ---------------------------------------------------- Manage Alarms List
    st.subheader("📋 Your Alarms")
    if not st.session_state.alarms:
        st.info("No alarms set yet. Add one above!")
    else:
        for i, alarm in enumerate(st.session_state.alarms):
            col_info, col_toggle, col_del = st.columns([3, 1, 1])
            
            moment = datetime.strptime(alarm["time"], "%H:%M")
            display_time = moment.strftime("%H:%M" if use_24h else "%I:%M %p")
            status_text = "🟢 ON" if alarm["active"] else "⚪ OFF"
            
            with col_info:
                st.write(f"**{status_text}** | {display_time} — {alarm['label']}")
            with col_toggle:
                if st.button("Toggle", key=f"toggle_{i}"):
                    alarm["active"] = not alarm["active"]
                    save_alarms(st.session_state.alarms)
                    st.rerun()
            with col_del:
                if st.button("Delete", key=f"del_{i}"):
                    st.session_state.alarms.pop(i)
                    save_alarms(st.session_state.alarms)
                    st.rerun()

with tab_world:
    st.subheader("🌍 World Time Zones")
    st.write("Current time across major international cities:")
    
    cities = {
        "New York (USA)": "America/New_York",
        "London (UK)": "Europe/London",
        "Tokyo (Japan)": "Asia/Tokyo",
        "Sydney (Australia)": "Australia/Sydney",
        "Dubai (UAE)": "Asia/Dubai",
        "Kolkata (India)": "Asia/Kolkata",
    }
    
    col_a, col_b = st.columns(2)
    idx = 0
    for city, tz_name in cities.items():
        tz = ZoneInfo(tz_name)
        city_time = datetime.now(tz)
        formatted_time = city_time.strftime("%I:%M:%S %p")
        formatted_date = city_time.strftime("%a, %d %b %Y")
        
        target_col = col_a if idx % 2 == 0 else col_b
        with target_col:
            st.metric(label=city, value=formatted_time, delta=formatted_date)
        idx += 1

time.sleep(1)
st.rerun()