import pickle
import pandas as pd
import os


def get_travel_time(journey_pattern_id, source, destination, date_time):
    """Takes in a user's query and returns the model's predictions"""

    day = get_day(date_time)
    time_category = get_time_category(date_time)
    
    absolute_path = os.path.dirname(os.path.realpath(__file__))
    absolute_path = absolute_path.replace('\\', '/')

    # Map time category to the new speed category with the model's pickle file
    with open(os.path.abspath(absolute_path + '/static/Models/' + journey_pattern_id + '_speeds.pickle'), 'rb') as handle:
        hash_table = pickle.load(handle)

        # If the bus runs then get the speed
        try:
            speed = hash_table[day][time_category]

        except:
            # If there's no data for that day
            speed = "Medium"

        # If the Day doesn't exist then return (bus doesn't run that day)
        try:
            hash_table[day]

        except:
            speed = 'NA'

    # Get model's predictions
    source_time = get_prediction(journey_pattern_id, source, speed, day)
    destination_time = get_prediction(journey_pattern_id, destination, speed, day)

    return [destination_time[0], source_time[0]]


def get_prediction(journey_pattern_id, distance, speed, day):
    """Return model's prediction"""

    query = {"Distance": [distance], "Fast": [0], "Medium": [0], "Slow": [0], "Sat": [0], "Sun": [0], "Mon-Fri": [0]}

    query[speed] = 1
    query[day] = 1

    df = pd.DataFrame(query)

    absolute_path = os.path.dirname(os.path.realpath(__file__))
    absolute_path = absolute_path.replace('\\', '/')

    try:
        with open( os.path.abspath(absolute_path + '/static/Models/' + journey_pattern_id + '.pickle'), 'rb') as handle:
            lm = pickle.load(handle)

            prediction = lm.predict(df)
        
    except:
        # If a bus does not work on a certain day and the user picks that day, return not a number
        prediction = ['A']

    return prediction


def get_time_category(date_time):
    """Get time category for speed value"""

    time_cat = date_time[16:21]
    mins = time_cat[3:]

    if int(mins) >= 30:
        ans = "30:00"
    else:
        ans = "00:00"

    return time_cat[:3] + ans


def get_day(date_time):
    """Return either Mon-Fri, Sat or Sun"""

    day = date_time[:3]

    # This is for the last for when it uses this function
    if day == "Mon" or day == "Tue" or day == "Wed" or day == "Thu" or day == "Fri":
        day = "Mon-Fri"

    return day
