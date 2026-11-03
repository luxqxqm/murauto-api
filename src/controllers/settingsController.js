import { Service } from '../models/service.js';
import { getSettings } from '../models/settings.js';

const toPublic = (settings) => ({
  workingHours: settings.workingHours,
  slotStepMin: settings.slotStepMin,
  postsCount: settings.postsCount,
  daysOff: settings.daysOff,
});

export const getPublicSettings = async (req, res) => {
  const settings = await getSettings();
  res.status(200).json(toPublic(settings));
};

export const updateSettings = async (req, res) => {
  const { workingHours, ...rest } = req.body;
  const settings = await getSettings();

  // Every active service duration must stay a multiple of the new step
  if (rest.slotStepMin && rest.slotStepMin !== settings.slotStepMin) {
    const services = await Service.find({ isActive: true }).select(
      'name durationMin',
    );
    const unfit = services.filter(
      (service) => service.durationMin % rest.slotStepMin !== 0,
    );

    if (unfit.length > 0) {
      const names = unfit
        .map((service) => `${service.name} (${service.durationMin} хв)`)
        .join(', ');
      return res.status(400).json({
        message: `Спочатку змініть тривалість послуг, не кратну ${rest.slotStepMin} хв: ${names}`,
      });
    }
  }

  // Replace only the days that were sent
  for (const [day, hours] of Object.entries(workingHours ?? {})) {
    settings.set(`workingHours.${day}`, hours);
  }
  settings.set(rest);
  await settings.save();

  res.status(200).json(toPublic(settings));
};
